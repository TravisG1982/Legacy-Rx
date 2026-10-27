import { createFileRoute, Link, useBlocker, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { FunnelShell } from "../components/FunnelShell";

import { CONTRAINDICATIONS, HORMONE_CONTRAINDICATIONS, MED_INFO, MEDS, PROGRAM_TRACKS, STATES, isMedKey, medsForTrack, type MedKey, type Plan, type ProgramTrack, type Track } from "../lib/legacyrx-data";
import { readFunnel, writeFunnel, type FunnelStep } from "../lib/funnel-store";
import { trackFunnelEvent } from "../lib/analytics";
import { saveLeadDebounced, saveLeadNow } from "../lib/lead-capture";
import { useLivePrices } from "@/hooks/use-live-prices";
import { OfferUrgency } from "@/components/OfferUrgency";
import { LiveViewers, SpotsLeft, StickyUrgency } from "@/components/PlanUrgency";

import { ReviewingResponses } from "@/components/ReviewingResponses";
import { EMAIL_RE, commitStep1, focusFirstStep1Error, validateStep1Fields, type Step1Errors } from "../lib/qualify-step1";
import { getAssessmentProgress, invalidateAssessment, submitAssessmentStep1, submitAssessmentStep2 } from "../lib/assessment.functions";


export const Route = createFileRoute("/qualify")({
  validateSearch: (search: Record<string, unknown>): { step?: FunnelStep; track?: ProgramTrack; med?: MedKey } => {
    const requestedStep = Number(search.step);
    const out: { step?: FunnelStep; track?: ProgramTrack; med?: MedKey } = {};
    if ((PROGRAM_TRACKS as readonly unknown[]).includes(search.track)) out.track = search.track as ProgramTrack;
    if (isMedKey(search.med)) out.med = search.med;
    if (requestedStep === 2 || requestedStep === 3) out.step = requestedStep as FunnelStep;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Start Your Assessment - LegacyRX" },
      { name: "description", content: "Take the 2-minute LegacyRX health assessment to see if you qualify for a doctor-prescribed compounded GLP-1 program." },
      { property: "og:title", content: "Start Your Assessment - LegacyRX" },
      { property: "og:description", content: "See if you qualify for a doctor-prescribed GLP-1 program." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QualifyPage,
});

const TRACK_LABEL: Record<ProgramTrack, string> = { trt: "Testosterone (TRT)", hrt: "Women's HRT", aa: "Anti-aging / longevity", sh: "Sexual health (ED)" };

const defaultPlan = (k: MedKey): Plan["id"] => (MEDS[k].plans.some((p) => p.id === "3") ? "3" : MEDS[k].plans[0]!.id);

const INCLUDED: [string, string, string, string][] = [
  ["💉", "Full Medication Supply", "Complete monthly doses included", "$300+ value"],
  ["🚚", "Priority Shipping", "FREE express delivery to your door", "$50 value"],
  ["🩺", "Doctor Consultations", "Unlimited provider access", "$200 value"],
  ["💗", "Health Monitoring", "Ongoing dose optimization", "$100 value"],
  ["📦", "Injection Supplies", "Syringes, alcohol pads & sharps container", "$75 value"],
  ["💬", "24/7 Support Team", "Text or call anytime", "$150 value"],
];

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


// Analytics receives only generic event names, never screening answers.




function QualifyPage() {
  const navigate = useNavigate({ from: "/qualify" });
  const search = Route.useSearch();
  const requestedTrack: Track = search.track ?? "glp1";
  // A program with no orderable products falls back to weight loss.
  const track: Track = medsForTrack(requestedTrack).length ? requestedTrack : "glp1";
  const getProgress = useServerFn(getAssessmentProgress);
  const submitStep1 = useServerFn(submitAssessmentStep1);
  const submitStep2 = useServerFn(submitAssessmentStep2);
  const clearProgress = useServerFn(invalidateAssessment);
  const [verifiedState, setVerifiedState] = useState<{ track: Track; step: FunnelStep } | null>(null);
  const verifiedStep = verifiedState?.track === track ? verifiedState.step : null;
  const [submitting, setSubmitting] = useState(false);
  const step: FunnelStep = verifiedStep === null ? 1 : Math.min(search.step ?? 1, verifiedStep) as FunnelStep;
  const trackMeds = medsForTrack(track);
  const conditionList = track === "glp1" ? CONTRAINDICATIONS : HORMONE_CONTRAINDICATIONS[track];
  // Hormone programs: recent blood work answer (doctor orders labs if none).
  const [labs, setLabs] = useState<string | null>(null);

  // Step 1 state
  const [state, setState] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age18, setAge18] = useState<string | null>(null);
  const [onGlp1, setOnGlp1] = useState<string | null>(null);
  const [emailConsent, setEmailConsent] = useState(false);
  const [emailMarketingConsent, setEmailMarketingConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [smsMarketing, setSmsMarketing] = useState(false);
  const [errors1, setErrors1] = useState<Step1Errors>({});
  const [gateEmail, setGateEmail] = useState("");
  const [gateDone, setGateDone] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  // Short "reviewing your responses" moment shown between step 1 and step 2.
  const [reviewing, setReviewing] = useState(false);

  // Step 2 state
  const [none, setNone] = useState(false);
  const [conds, setConds] = useState<Set<number>>(new Set());
  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Step 3 state
  const { price: livePrice } = useLivePrices();
  const [med, setMed] = useState<MedKey>("sema");
  const [plan, setPlan] = useState<Plan["id"]>("3");
  const hydratedRef = useRef(false);

  useEffect(() => {
    let active = true;
    setVerifiedState(null);
    getProgress({ data: track })
      .then(({ step: allowed }) => {
        if (!active) return;
        setVerifiedState({ track, step: allowed });
      })
      .catch(() => {
        if (active) setVerifiedState({ track, step: 1 });
      });
    return () => { active = false; };
  }, [track, getProgress]);

  useEffect(() => {
    if (verifiedStep !== null && (search.step ?? 1) > verifiedStep) {
      navigate({ search: (prev) => ({ ...prev, step: verifiedStep === 1 ? undefined : verifiedStep }), replace: true });
    }
  }, [search.step, verifiedStep, navigate]);


  const pct = step * 25;

  // Keep browser/device Back inside the funnel: on the first stage a Back
  // action must not leave for the home page or the referring page.
  useBlocker({
    shouldBlockFn: ({ action, current, next }) => {
      if (action !== "BACK" && action !== "GO") return false;
      if (current.pathname !== "/qualify") return false;
      const currentStep = (current.search as { step?: number }).step ?? step;
      if (currentStep !== 1) return false;
      const nextStep = (next.search as { step?: number }).step ?? 1;
      // Allow moving between funnel stages, block anything that exits stage 1.
      return !(next.pathname === "/qualify" && nextStep !== 1);
    },
    enableBeforeUnload: false,
  });

  // Hard entry / reload has no client history to block against, so add one
  // same-page sentinel entry that absorbs the first Back gesture.
  const sentinelRef = useRef(false);
  useEffect(() => {
    if (sentinelRef.current) return;
    if (typeof window === "undefined") return;
    if (step !== 1) return;
    sentinelRef.current = true;
    window.history.pushState({ ...(window.history.state ?? {}), funnelSentinel: true }, "", window.location.href);
  }, [step]);


  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const saved = readFunnel();
    const contact = saved.contact;
    const answers = saved.answers;
    if (contact) {
      setState(contact.state ?? "");
      setFirstName(contact.firstName ?? "");
      setLastName(contact.lastName ?? "");
      setEmail(contact.email ?? "");
      setPhone(contact.phone ?? "");
    }
    if (answers) {
      setAge18(answers.age18 ?? null);
      setOnGlp1(answers.onGlp1 ?? null);
      // Older saved answers used preselected marketing boxes. Only restore
      // consent choices made with the new separate, opt-in controls.
      const currentConsent = answers.consentVersion === 2;
      setEmailConsent(currentConsent ? (answers.emailConsent ?? false) : false);
      setEmailMarketingConsent(currentConsent ? (answers.emailMarketingConsent ?? false) : false);
      setSmsConsent(currentConsent ? (answers.smsConsent ?? false) : false);
      setSmsMarketing(currentConsent ? (answers.smsMarketing ?? false) : false);
      setNone(answers.none ?? false);
      setConds(new Set(answers.conditions ?? []));
    }
    const wanted = search.med && MED_INFO[search.med].track === track ? search.med : saved.med;
    const startMed = MED_INFO[wanted]?.track === track ? wanted : trackMeds[0]!;
    setMed(startMed);
    setPlan(MEDS[startMed].plans.some((p) => p.id === saved.plan) && startMed === saved.med ? saved.plan : defaultPlan(startMed));
  }, []);

  // Record the lead as soon as someone starts typing, even if they never
  // click Continue (those stay marked "unregistered").
  useEffect(() => {
    if (step !== 1) return;
    const hasAnything =
      firstName.trim() || lastName.trim() || email.trim() || phone.trim() || state || age18 || onGlp1;
    if (!hasAnything) return;
    saveLeadDebounced({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone,
      state,
      age18,
      onGlp1,
      emailConsent,
      emailMarketingConsent,
      smsTransactionalConsent: smsConsent,
      smsMarketingConsent: smsMarketing,
    });
  }, [step, firstName, lastName, email, phone, state, age18, onGlp1, emailConsent, emailMarketingConsent, smsConsent, smsMarketing]);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // Reaching the plan step is the real "viewed the offer" moment.
    if (step === 3) trackFunnelEvent("ViewContent", { funnel_step: "plan_selection" });
  }, [step]);




  function toggleCond(i: number) {
    setNone(false);
    setStep2Error(null);
    setConds((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });
  }

  async function validateStep1() {
    if (submitting || verifiedStep === null) return;
    // If user explicitly answered "no" to age, disqualify immediately.
    if (age18 === "no") {
      try { await clearProgress(); } catch { toast.error("Please try again."); return; }
      setVerifiedState({ track, step: 1 });
      saveLeadNow({ age18: "no", stage: "not_eligible" });
      navigate({ to: "/not-eligible" });
      return;
    }

    const values = {
      state, firstName, lastName, email, phone, age18, onGlp1, emailConsent, emailMarketingConsent, smsConsent, smsMarketing,
    };
    const e = validateStep1Fields(values);
    setErrors1(e);
    if (Object.keys(e).length > 0) {
      focusFirstStep1Error(e);
      return;
    }
    setSubmitting(true);
    try {
      await submitStep1({ data: {
        ...values,
        track,
        age18: age18 as "yes",
        onGlp1: onGlp1 as "yes" | "no",
        emailConsent: emailConsent as true,
      } });
      commitStep1(values);
      setVerifiedState({ track, step: 2 });
      navigate({ search: (prev) => ({ ...prev, step: 2 }) });
    } catch {
      toast.error("We couldn't save your assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const finishReview = useCallback(() => {
    setReviewing(false);
    navigate({ search: (prev) => ({ ...prev, step: 3 }) });
  }, [navigate]);

  async function validateStep2() {
    if (submitting || verifiedStep === null || verifiedStep < 2) return;
    if (none) {
      if (track !== "glp1" && track !== "sh" && !labs) {
        setStep2Error("Please tell us about recent blood work.");
        return;
      }
      setStep2Error(null);
      const intake = track === "glp1" ? undefined : [
        `${TRACK_LABEL[track]} intake.`,
        `Screening: none of the listed conditions apply.`,
        `Currently on hormone medication: ${onGlp1 ?? "not answered"}.`,
        ...(track === "sh" ? [] : [`Blood work in past 6 months: ${labs}.`]),
      ].join(" ");
      setSubmitting(true);
      try {
        await submitStep2({ data: { track, none: true, conditions: [...conds], labs: labs === "yes" || labs === "no" ? labs : null } });
        writeFunnel({ answers: { none: true, conditions: [], intake }, latestStep: 3 });
        saveLeadNow({ stage: "plan_selection" });
        setVerifiedState({ track, step: 3 });
        setReviewing(true);
      } catch {
        setStep2Error("We couldn't save your screening. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    // User selected one or more contraindications, or selected nothing.
    if (conds.size > 0) {
      try { await clearProgress(); } catch { setStep2Error("Please try again."); return; }
      setVerifiedState({ track, step: 1 });
      saveLeadNow({ stage: "not_eligible" });
      navigate({ to: "/not-eligible" });
      return;
    }
    setStep2Error('Please select "None of these apply to me" to continue.');
    toast.error('Please select an option to continue.');
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        document.querySelector('[data-field="conditions"]')?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    }
  }

  function toCheckout() {
    writeFunnel({ med, plan, answers: { agree: true }, latestStep: 3 });
    const selectedPlan = MEDS[med].plans.find((p) => p.id === plan);
    trackFunnelEvent("AddToCart", {
      medication: med,
      medication_name: MEDS[med].name,
      plan_id: plan,
      plan_label: selectedPlan?.label,
      value: selectedPlan?.total,
      currency: "USD",
    });

    saveLeadNow({ stage: "added_to_cart" });
    // Internal checkout: stay on-site instead of opening an external checkout tab.
    navigate({ to: "/start/$med", params: { med } });
  }


  if (verifiedStep === null) {
    return <FunnelShell pct={25} wide={false}><p className="qsub">Checking your assessment…</p></FunnelShell>;
  }

  return (
    <FunnelShell pct={pct} wide={false}>
      <ReviewingResponses open={reviewing} onDone={finishReview} />
      {step === 1 && !gateDone && (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const v = gateEmail.trim();
            if (!EMAIL_RE.test(v) || v.length > 255) { setGateError("Enter a valid email address."); return; }
            writeFunnel({ contact: { email: v } });
            setEmail(v);
            setGateDone(true);
          }}
        >
          <h2 className="qcard-title">Let's get started</h2>
          <div className="field">
            <label htmlFor="gate-email">Enter your email to get started</label>
            <input
              id="gate-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={gateEmail}
              maxLength={255}
              onChange={(e) => { setGateEmail(e.target.value); setGateError(null); }}
              className={gateError ? "invalid" : undefined}
            />
            {gateError && <div className="field-error">{gateError}</div>}
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={{ width: "100%" }}>Start My Assessment →</button>
        </form>
      )}
      {step === 1 && gateDone && (
        <div>
          <h2 className="qcard-title">Which state do you live in?</h2>
          <p className="qsub">This helps us connect you with a licensed provider in your state.</p>
          <div className="field" data-field="state">
            <label htmlFor="qualify-state">State</label>
            <select
              id="qualify-state"
              value={state}
              onChange={(e) => { setState(e.target.value); setErrors1((p) => ({ ...p, state: undefined })); }}
              className={errors1.state ? "invalid" : undefined}
            >
              <option value="" disabled>Select your state</option>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
            {errors1.state && <div className="field-error">{errors1.state}</div>}
          </div>
          <div className="lx-grid grid-2">
            <div className="field" data-field="firstName">
              <label htmlFor="qualify-first-name">First Name</label>
              <input
                id="qualify-first-name"
                autoComplete="given-name"
                placeholder="John"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setErrors1((p) => ({ ...p, firstName: undefined })); }}
                className={errors1.firstName ? "invalid" : undefined}
              />
              {errors1.firstName && <div className="field-error">{errors1.firstName}</div>}
            </div>
            <div className="field" data-field="lastName">
              <label htmlFor="qualify-last-name">Last Name</label>
              <input
                id="qualify-last-name"
                autoComplete="family-name"
                placeholder="Smith"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setErrors1((p) => ({ ...p, lastName: undefined })); }}
                className={errors1.lastName ? "invalid" : undefined}
              />
              {errors1.lastName && <div className="field-error">{errors1.lastName}</div>}
            </div>
          </div>
          <div className="field" data-field="email">
            <label htmlFor="qualify-email">Email</label>
            <input
              id="qualify-email"
              type="email"
              autoComplete="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors1((p) => ({ ...p, email: undefined })); }}
              className={errors1.email ? "invalid" : undefined}
            />
            {errors1.email && <div className="field-error">{errors1.email}</div>}
          </div>
          <label className="check-row" data-field="emailConsent" style={{ margin: "4px 0 16px" }}>
            <input
              type="checkbox"
              checked={emailConsent}
              onChange={(e) => { setEmailConsent(e.target.checked); setErrors1((p) => ({ ...p, emailConsent: undefined })); }}
            />
            <span>
              I understand that LegacyRX will email me about my assessment, clinician correspondence,
              account, and order at the address above. These emails are needed to complete my request.
            </span>
          </label>
          {errors1.emailConsent && <div className="field-error">{errors1.emailConsent}</div>}

          <label className="check-row" style={{ margin: "4px 0 16px" }}>
            <input
              type="checkbox"
              checked={emailMarketingConsent}
              onChange={(e) => setEmailMarketingConsent(e.target.checked)}
            />
            <span>I would also like to receive optional marketing emails from LegacyRX. This is not required to continue.</span>
          </label>

          <div className="field" data-field="phone">
            <label htmlFor="qualify-phone">Phone Number</label>
            <input
              id="qualify-phone"
              type="tel"
              autoComplete="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setErrors1((p) => ({ ...p, phone: undefined })); }}
              className={errors1.phone ? "invalid" : undefined}
            />
            {errors1.phone && <div className="field-error">{errors1.phone}</div>}
          </div>

          <p id="qualify-age-question" style={{ fontWeight: 600, margin: "16px 0 6px" }}>Are you 18 or older?</p>
          <div className="yesno" data-field="age18" role="group" aria-labelledby="qualify-age-question">
            <button type="button" aria-pressed={age18 === "yes"} className={`opt ${age18 === "yes" ? "selected" : ""}`} onClick={() => { setAge18("yes"); setErrors1((p) => ({ ...p, age18: undefined })); }}>Yes<span className="optcheck" aria-hidden="true">✓</span></button>
            <button type="button" aria-pressed={age18 === "no"} className={`opt ${age18 === "no" ? "selected" : ""}`} onClick={() => { setAge18("no"); setErrors1((p) => ({ ...p, age18: undefined })); }}>No<span className="optcheck" aria-hidden="true">✓</span></button>
          </div>
          {errors1.age18 && <div className="field-error">{errors1.age18}</div>}

          <p id="qualify-medication-question" style={{ fontWeight: 600, margin: "18px 0 6px" }}>{track === "glp1" ? "Are you currently taking a GLP-1 medication?" : track === "sh" ? "Are you currently taking any ED medication?" : "Are you currently taking any hormone medication?"}</p>
          <div className="yesno" data-field="onGlp1" role="group" aria-labelledby="qualify-medication-question">
            <button type="button" aria-pressed={onGlp1 === "yes"} className={`opt ${onGlp1 === "yes" ? "selected" : ""}`} onClick={() => { setOnGlp1("yes"); setErrors1((p) => ({ ...p, onGlp1: undefined })); }}>Yes<span className="optcheck" aria-hidden="true">✓</span></button>
            <button type="button" aria-pressed={onGlp1 === "no"} className={`opt ${onGlp1 === "no" ? "selected" : ""}`} onClick={() => { setOnGlp1("no"); setErrors1((p) => ({ ...p, onGlp1: undefined })); }}>No<span className="optcheck" aria-hidden="true">✓</span></button>
          </div>
          {errors1.onGlp1 && <div className="field-error">{errors1.onGlp1}</div>}


          <label className="check-row" data-field="smsConsent" style={{ marginTop: 16 }}>
            <input
              type="checkbox"
              checked={smsConsent}
              onChange={(e) => setSmsConsent(e.target.checked)}
            />
            <span>
              I consent to receive transactional text messages from LegacyRX regarding my account, including reminders
              to complete my signup, order updates, and support messages. Message &amp; data rates may apply. Reply STOP
              to opt out, HELP for help. Consent is not a condition of purchase.
            </span>
          </label>

          <label className="check-row" style={{ marginTop: 12 }}>
            <input
              type="checkbox"
              checked={smsMarketing}
              onChange={(e) => setSmsMarketing(e.target.checked)}
            />
            <span>
              I consent to receive marketing text messages from LegacyRX regarding promotions and special offers.
              Message frequency varies. Message and data rates may apply. Reply HELP for assistance or STOP to opt out.
            </span>
          </label>

          <p className="lx-muted" style={{ textAlign: "center", fontSize: ".82rem", marginTop: 14 }}>
            By clicking "Continue" you consent to our{" "}
            <Link to="/telehealth-consent" style={{ textDecoration: "underline" }}>Telehealth</Link>,{" "}
            <Link to="/privacy-policy" style={{ textDecoration: "underline" }}>Privacy Policy</Link> and{" "}
            <Link to="/terms-of-use" style={{ textDecoration: "underline" }}>Terms</Link>.
          </p>
          <div className="funnel-sticky-bar">
            <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={validateStep1} disabled={submitting}>
              {submitting ? "Saving…" : "Continue"}
            </button>
          </div>

        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="qcard-title">Do any of these apply to you?</h2>
          <p className="qsub">This helps our doctors ensure your safety.</p>
          <label data-field="conditions" className={`none-card ${none ? "selected" : ""}`}>
            <input type="checkbox" checked={none} onChange={(event) => { setNone(event.target.checked); if (event.target.checked) setConds(new Set()); setStep2Error(null); }} />
            <div>
              <strong>None of these apply to me</strong>
              <br />
              <span className="lx-muted" style={{ fontSize: ".85rem" }}>Most people select this option</span>
            </div>
          </label>
          <div className="divider-or">Or check any that apply</div>

          {conditionList.map((c, i) => (
            <label key={i} className="check-row">
              <input type="checkbox" checked={conds.has(i)} onChange={() => toggleCond(i)} />
              <span>{c}</span>
            </label>
          ))}
          {track !== "glp1" && track !== "sh" && (
            <>
              <p id="qualify-labs-question" style={{ fontWeight: 600, margin: "18px 0 6px" }}>Have you had blood work (hormone levels) in the past 6 months?</p>
              <div className="yesno" role="group" aria-labelledby="qualify-labs-question">
                <button type="button" aria-pressed={labs === "yes"} className={`opt ${labs === "yes" ? "selected" : ""}`} onClick={() => { setLabs("yes"); setStep2Error(null); }}>Yes<span className="optcheck" aria-hidden="true">✓</span></button>
                <button type="button" aria-pressed={labs === "no"} className={`opt ${labs === "no" ? "selected" : ""}`} onClick={() => { setLabs("no"); setStep2Error(null); }}>No<span className="optcheck" aria-hidden="true">✓</span></button>
              </div>
              <p className="lx-muted" style={{ fontSize: ".82rem", marginTop: 6 }}>
                {labs === "no"
                  ? "No problem - your doctor will order a simple blood test before prescribing."
                  : "Your doctor may ask you to share your results."}
              </p>
            </>
          )}
          {step2Error && <div className="field-error" style={{ marginTop: 10 }}>{step2Error}</div>}
          <div className="funnel-sticky-bar">
            <button type="button" className="btn btn-ghost" onClick={() => navigate({ search: (prev) => ({ ...prev, step: undefined }) })}>← Back</button>
            <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={validateStep2} disabled={submitting}>{submitting ? "Saving…" : "Continue"}</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="qualify-banner">
            <div style={{ fontFamily: "var(--display)", fontSize: "1.3rem" }}>Assessment complete</div>
            <div style={{ fontSize: ".9rem", opacity: 0.92 }}>Choose a plan to continue. A licensed clinician will review your full application and decide whether treatment is appropriate.</div>
          </div>
          <OfferUrgency variant="plan" />
          <LiveViewers />
          <div className="expires">✓ Flat monthly pricing</div>


          <p id="qualify-med-choice" style={{ fontWeight: 600, marginBottom: 8 }}>Choose Your Medication</p>
          <div className="med-toggle" role="group" aria-labelledby="qualify-med-choice">
            {trackMeds.map((k) => (
              <button key={k} type="button" aria-pressed={med === k} className={`opt ${med === k ? "selected" : ""}`} onClick={() => { setMed(k); setPlan(defaultPlan(k)); }}>
                {MEDS[k].name}
                <span className="medfrom">
                  {k === "sema" ? `from ${money(livePrice("sema", "3").monthly)}/mo`
                    : k === "tirz" ? `from ${money(livePrice("tirz", "3").monthly)}/mo · newest`
                    : `from ${money(livePrice(k, "3").monthly)}/mo`}
                </span>
                <span className="optcheck" aria-hidden="true">✓</span>
              </button>
            ))}
          </div>


          <p id="qualify-plan-choice" style={{ fontWeight: 600, marginBottom: 4 }}>Select Your Plan</p>
          <SpotsLeft />

          <div role="group" aria-labelledby="qualify-plan-choice">
          {MEDS[med].plans.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={plan === p.id}
              className={`planrow ${plan === p.id ? "selected" : ""}`}
              onClick={() => setPlan(p.id)}
            >
              {p.badgeText && <span className={`plan-badge ${p.badge}`}>{p.badgeText}</span>}
              <span className="planrow-details">
                <span style={{ fontWeight: 700 }}>{p.label}</span>
                <span className="lx-muted" style={{ fontSize: ".85rem" }}>
                  {p.then
                    ? `Then ${money(p.then)}/mo`
                    : `${money(livePrice(med, p.id).total)} total`}
                </span>
              </span>
              <span style={{ textAlign: "right", flexShrink: 0 }}>

                <span style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 3, whiteSpace: "nowrap" }}>
                  <span className="pmo">{money(livePrice(med, p.id).monthly)}</span>
                  <span className="lx-muted" style={{ fontSize: ".78rem" }}>{p.then ? "first month" : "/month"}</span>
                </span>
                {p.save > 0 && <span className="save-pill">SAVE ${p.save.toLocaleString("en-US")}</span>}
              </span>




            </button>
          ))}
          </div>

          <p className="lx-muted" style={{ fontSize: ".85rem", margin: "14px 0" }}>
            Your full application will be reviewed by a U.S.-licensed doctor after your purchase.
          </p>

          <div className="included">
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <strong style={{ color: "var(--burgundy)" }}>✓ EVERYTHING INCLUDED</strong>
              <div className="lx-muted" style={{ fontSize: ".85rem" }}>Over $875 in value with every plan</div>
            </div>
            {INCLUDED.map((it, i) => (
              <div key={i} className="incl-row" style={i === INCLUDED.length - 1 ? { borderBottom: 0 } : undefined}>
                <span style={{ fontSize: "1.2rem" }}>{it[0]}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: ".92rem" }}>{it[1]}</div>
                  <div className="lx-muted" style={{ fontSize: ".82rem" }}>{it[2]}</div>
                </div>
                <span className="val">{it[3]}</span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 12, fontSize: ".8rem", color: "var(--muted)" }}>
            🛡 HIPAA Compliant · ✓ Licensed Pharmacies · 🚚 Free Shipping
          </div>
          <p className="ssl">🔒 Secure checkout • No hidden fees</p>
          <div className="funnel-sticky-bar funnel-sticky-bar--stack">
            <StickyUrgency />
            <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={toCheckout}>Continue →</button>
          </div>



        </div>
      )}
    </FunnelShell>
  );
}
