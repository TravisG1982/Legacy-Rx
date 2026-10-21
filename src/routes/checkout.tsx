import { Link, createFileRoute, useBlocker, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { FunnelShell } from "../components/FunnelShell";
import { TrustBadges } from "../components/TrustBadges";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { MED_INFO, STATES, STATE_CODES, productFor } from "../lib/legacyrx-data";
import { PRODUCT_IMAGES } from "@/lib/product-images";
import { readFunnel, resolvePlan, type FunnelState } from "../lib/funnel-store";
import { trackFunnelEvent, trackGa4 } from "../lib/analytics";
import { saveLeadNow, leadSessionId } from "../lib/lead-capture";
import { checkCoupon, totalWithCoupon, type CouponResult } from "../lib/coupon";
import { useLivePrices } from "@/hooks/use-live-prices";
import { logOrderFailure } from "../lib/order-failures.functions";
import { setQuietMode } from "../lib/quiet-mode";
import { getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession, getCheckoutStatus } from "../lib/checkout-session.functions";
import { LEGACY_STRIPE_CHECKOUT_ENABLED } from "../lib/legacy-stripe-checkout";
import { OfferUrgency } from "@/components/OfferUrgency";
import logo from "../assets/legacyrx-burgundy.webp";
import semaVial from "../assets/semaglutide-vial.webp";


export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): { payment?: string; session_id?: string } => ({
    payment: typeof search.payment === "string" ? search.payment : undefined,
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Checkout - LegacyRX" },
      { name: "description", content: "Complete your LegacyRX order. Secure checkout, no hidden fees, cancel anytime." },
      { property: "og:title", content: "Checkout - LegacyRX" },
      { property: "og:description", content: "Secure checkout for your LegacyRX program." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutRoute,
});

function CheckoutRoute() {
  if (LEGACY_STRIPE_CHECKOUT_ENABLED) return <CheckoutPage />;
  return (
    <FunnelShell pct={100} wide hideTrust>
      <h1 className="qcard-title">Start your order</h1>
      <p className="qsub">This checkout is unavailable. Complete the assessment to continue to our secure FuseHealth form.</p>
      <Link className="btn btn-primary" to="/qualify">Start assessment</Link>
    </FunnelShell>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

/** Formats digits as MM/DD/YYYY while typing. */
function formatDob(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Real-date check plus the 18-100 age window a provider can serve. */
function dobError(value: string): string {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "Enter your date of birth as MM/DD/YYYY.";
  const mm = Number(m[1]);
  if (mm < 1 || mm > 12) return "Month must be 01-12.";
  const birth = new Date(Number(m[3]), mm - 1, Number(m[2]));
  if (Number.isNaN(birth.getTime()) || birth.getDate() !== Number(m[2])) return "Enter a real date of birth.";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  if (age < 18) return "You must be 18 or older to order.";
  if (age > 100) return "Enter a valid date of birth.";
  return "";
}

const FIELD_LABELS: Record<string, string> = {
  email: "email",
  firstName: "first name",
  lastName: "last name",
  phone: "phone number",
  dob: "date of birth",
  gender: "biological sex",
  zip: "ZIP code",
  street: "street address",
  city: "city",
  shipState: "state",
};

function errCls(msg?: string) {
  return msg ? "cofield-invalid" : undefined;
}


function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="cofield-error" role="alert">
      <span aria-hidden="true">!</span> {msg}
    </p>
  );
}


type SavedAddress = { street?: string; apt?: string; city?: string; zip?: string; shipState?: string };
const ADDRESS_KEY = "legacyrx.delivery-address";

/** Reads the last delivery address the visitor entered on this device. */
function readSavedAddress(): SavedAddress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ADDRESS_KEY);
    return raw ? (JSON.parse(raw) as SavedAddress) : null;
  } catch {
    return null;
  }
}

/** Stores the delivery address so it is prefilled on every later visit. */
function writeSavedAddress(next: SavedAddress) {
  if (typeof window === "undefined") return;
  if (!next.street && !next.city && !next.zip && !next.shipState) return;
  try {
    window.localStorage.setItem(ADDRESS_KEY, JSON.stringify(next));
  } catch {
    /* storage can be blocked in in-app browsers */
  }
}

type Stage = "address" | "payment" | "done";




/** Medical answers from the intake, forwarded to the doctor's review. */
function medicalAnswers(s: FunnelState): { onGlp1?: "yes" | "no"; conditions?: string } {
  const a = s.answers ?? {};
  const onGlp1 = a.onGlp1 === "yes" || a.onGlp1 === "no" ? a.onGlp1 : undefined;
  return { onGlp1, conditions: a.intake ?? JSON.stringify(a.conditions ?? []) };
}

function CheckoutPage() {
  const { price: livePrice } = useLivePrices();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/checkout" });
  const createSessionFn = useServerFn(createCheckoutSession);
  const statusFn = useServerFn(getCheckoutStatus);
  const [state, setState] = useState<FunnelState>({ med: "sema", plan: "3" });
  const [stage, setStage] = useState<Stage>("address");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);


  // Contact + shipping
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [shipState, setShipState] = useState("");
  const [street, setStreet] = useState("");
  const [apt, setApt] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  // Required by the fulfillment provider's patient record.
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Contact details normally arrive from /qualify. Only the ones that are
  // missing (e.g. someone deep-linking to /checkout) are asked for again.
  const [contactGaps, setContactGaps] = useState({ email: false, name: false, phone: false });
  const [addressReady, setAddressReady] = useState(false);
  const [usedSavedAddress, setUsedSavedAddress] = useState(false);
  // Set when validation fails: the field to scroll to once it has rendered.
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);


  // Payment: the amount is fixed server-side, the card is taken in the
  // embedded form, so no card fields live on this page.
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentAttempted, setPaymentAttempted] = useState(false);
  const [payErrors, setPayErrors] = useState<Record<string, string>>({});
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [exitPrompt, setExitPrompt] = useState(false);
  const [assistSent, setAssistSent] = useState(false);
  // Return flow: the payment provider redirects back here after payment.
  const [returnPolling, setReturnPolling] = useState(false);
  const [returnFailed, setReturnFailed] = useState(false);


  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const fieldRefs = {
    email: useRef<HTMLInputElement>(null),
    firstName: useRef<HTMLInputElement>(null),
    lastName: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    dob: useRef<HTMLInputElement>(null),
    gender: useRef<HTMLSelectElement>(null),
    street: useRef<HTMLInputElement>(null),
    shipState: useRef<HTMLSelectElement>(null),
    city: useRef<HTMLInputElement>(null),
    zip: useRef<HTMLInputElement>(null),
  };

  const orderCompletedRef = useRef(false);

  const backBlocker = useBlocker({
    shouldBlockFn: ({ action, next }) => {
      const nextStep = (next.search as { step?: number }).step;
      return (action === "BACK" || action === "GO") && (next.pathname !== "/qualify" || nextStep !== 3);
    },
    enableBeforeUnload: false,
    withResolver: true,
  });

  useEffect(() => {
    if (backBlocker.status !== "blocked") return;
    backBlocker.reset();
    if (stage === "payment") {
      setStage("address");
      return;
    }
    navigate({ to: "/qualify", search: { step: 3 }, replace: true });
  }, [backBlocker, navigate, stage]);

  // Silence overlays while payment details are being entered; restore on leave.
  useEffect(() => {
    setQuietMode(stage === "payment");
    return () => setQuietMode(false);
  }, [stage]);

  // One quiet rescue once payment has started: if the shopper looks away or
  // moves the pointer out of the window, a half-finished order is callable.
  useEffect(() => {
    if (stage !== "payment" || !paymentAttempted || assistSent || orderCompletedRef.current) return;
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setExitPrompt(true);
      trackGa4("checkout_exit_intent", { medication: state.med, plan_id: plan.id });
    };
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 4) show();
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") show();
    };
    document.addEventListener("mouseout", onLeave);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("mouseout", onLeave);
      document.removeEventListener("visibilitychange", onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, paymentAttempted, assistSent]);



  const [stateOptions, setStateOptions] = useState<{ name: string; code: string }[]>(
    STATES.map((s) => ({ name: s, code: STATE_CODES[s] ?? "" })),
  );

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch("/api/states");
        const json = (await res.json()) as { states?: { name: string; code: string }[] };
        if (alive && json.states && json.states.length) setStateOptions(json.states);
      } catch {
        /* keep the built-in list */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, left: 0 });
    const s = readFunnel();
    setState(s);
    const c = s.contact ?? {};
    if (c.email) setEmail(c.email);
    if (c.firstName) setFirstName(c.firstName);
    if (c.lastName) setLastName(c.lastName);
    if (c.phone) setPhone(c.phone);
    if (c.state) setShipState(c.state);
    setContactGaps({
      email: !EMAIL_RE.test((c.email ?? "").trim()),
      name: !(c.firstName ?? "").trim() || !(c.lastName ?? "").trim(),
      phone: (c.phone ?? "").replace(/\D/g, "").length !== 10,
    });
    const saved = readSavedAddress();
    if (saved) {
      if (saved.street) setStreet(saved.street);
      if (saved.apt) setApt(saved.apt);
      if (saved.city) setCity(saved.city);
      if (saved.zip) setZip(saved.zip);
      // The state answered in the questionnaire always wins over an older
      // saved address, so nobody ships to a stale state without noticing.
      if (saved.shipState && !c.state) setShipState(saved.shipState);
      if (saved.street || saved.city || saved.zip) setUsedSavedAddress(true);
    }
    setAddressReady(true);
  }, []);

  // Persist the delivery address as it is filled in.
  useEffect(() => {
    if (!addressReady) return;
    writeSavedAddress({ street, apt, city, zip, shipState });
  }, [addressReady, street, apt, city, zip, shipState]);


  const { med, plan } = resolvePlan(state);
  const product = productFor(state.med, plan.id);
  // Price comes live from the LegacyRX pricing API, keyed by Product ID.
  const live = livePrice(state.med, plan.id);
  const subtotal = live.total;
  const payable = totalWithCoupon(subtotal, coupon);
  const discount = Math.max(0, subtotal - payable);
  const isFree = payable <= 0;
  const planSave = Math.max(0, Number(plan.save ?? 0));
  // Included-free perks shown in the summary (shipping, consult, care & supplies).
  const perkSave = 49 + 99 + 60;
  const todaysOff = planSave + perkSave;
  const errorCount = Object.values(errors).filter(Boolean).length;


  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code || couponBusy) return;
    setCouponBusy(true);
    setCouponError(null);
    const res = await checkCoupon(code, { med: state.med, productId: product.productId, email: email.trim() });
    setCouponBusy(false);
    if (!res.valid) {
      setCoupon(null);
      setCouponError(res.message || "That code isn't valid.");
      return;
    }
    setCoupon(res);
    // The payment session was priced with the old total — start fresh.
    if (clientSecret) setClientSecret(null);
  }

  // Screen order per step, so "first missing field" always matches what the user sees.
  const STEP_FIELDS = {
    // Contact details carry over from /qualify and only render when missing,
    // so they sit at the top of the single delivery screen.
    address: ["email", "firstName", "lastName", "phone", "dob", "gender", "street", "city", "shipState", "zip"],
  } as const;
  type FieldKey = keyof typeof fieldRefs;

  /** Scrolls a field clear of the sticky bar, focuses it, and pulses it. */
  function focusField(key: FieldKey) {
    const el = fieldRefs[key]?.current as HTMLElement | null | undefined;
    if (!el || typeof window === "undefined") return;
    const bottomBarGap = 140;
    const rect = el.getBoundingClientRect();
    const target = window.scrollY + rect.top - Math.max(100, (window.innerHeight - bottomBarGap) / 2);
    window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    el.classList.add("cofield-pulse");
    window.setTimeout(() => el.classList.remove("cofield-pulse"), 900);
    window.setTimeout(() => el.focus({ preventScroll: true }), 320);
  }


  /** Best-effort ZIP lookup so City/State fill themselves in. */
  async function lookupZip(code: string) {
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${code}`);
      if (!res.ok) return;
      const json = (await res.json()) as { places?: { "place name"?: string; state?: string }[] };
      const place = json.places?.[0];
      if (!place) return;
      if (place["place name"]) {
        setCity(place["place name"]);
        clearError("city");
      }
      if (place.state && stateOptions.some((s) => s.name === place.state)) {
        setShipState(place.state);
        clearError("shipState");
      }
    } catch {
      /* the user can still type City/State manually */
    }
  }

  /** Contact details normally carry over from /qualify. */
  function validateContact(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address.";
    if (!firstName.trim()) e.firstName = "Required.";
    if (!lastName.trim()) e.lastName = "Required.";
    if (phone.replace(/\D/g, "").length !== 10) e.phone = "Enter a 10-digit US phone number.";
    return e;
  }

  /** Single delivery screen: contact carry-over plus where it ships. */
  function validateAddress(): Record<string, string> {
    const e: Record<string, string> = { ...validateContact() };
    const dobMsg = dobError(dob);
    if (dobMsg) e.dob = dobMsg;
    if (!gender) e.gender = "Select your biological sex.";
    if (!street.trim()) e.street = "Required.";
    if (!city.trim()) e.city = "Required.";
    if (!shipState) e.shipState = "Select your state.";
    if (zip.replace(/\D/g, "").length !== 5) e.zip = "Enter a 5-digit US ZIP code.";
    return e;
  }

  function clearError(key: string) {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  }

  /** Keeps a half-finished checkout as a callable lead instead of a silent loss. */
  function saveCheckoutProgress() {
    const digits = phone.replace(/\D/g, "");
    const payload: Parameters<typeof saveLeadNow>[0] = { stage: "checkout_contact" };
    if (EMAIL_RE.test(email.trim())) payload.email = email.trim();
    if (firstName.trim()) payload.firstName = firstName.trim();
    if (lastName.trim()) payload.lastName = lastName.trim();
    if (digits.length === 10) payload.phone = digits;
    if (shipState) payload.state = shipState;
    saveLeadNow(payload);
  }

  /** Shows the failing fields, toasts, and jumps to the first one. */
  function reportErrors(e: Record<string, string>, step: keyof typeof STEP_FIELDS) {
    setErrors(e);
    // A contact detail carried over from /qualify can be missing even though its
    // input is hidden. Reveal exactly the ones that failed, so the message on
    // screen always has a matching field to fix.
    if (step === "address") {
      setContactGaps((prev) => ({
        email: prev.email || !!e['email'],
        name: prev.name || !!e['firstName'] || !!e['lastName'],
        phone: prev.phone || !!e['phone'],
      }));
    }
    const order = (STEP_FIELDS[step] ?? []) as readonly FieldKey[];
    const bad = order.filter((k) => e[k]);
    const firstBad = bad[0];
    if (!firstBad) return false;
    toast.error(
      bad.length > 1
        ? `We still need ${bad.length} details: ${bad.map((k) => FIELD_LABELS[k]).join(", ")}.`
        : `We still need your ${FIELD_LABELS[firstBad]}.`,
    );
    trackGa4("checkout_step_blocked", { step, fields: bad.join(","), field_count: bad.length });
    // Focus after the newly revealed field has rendered.
    setPendingFocus(firstBad);
    return true;
  }

  // Runs once the revealed field exists in the DOM.
  useEffect(() => {
    if (!pendingFocus) return;
    const key = pendingFocus as FieldKey;
    const id = requestAnimationFrame(() => {
      focusField(key);
      setPendingFocus(null);
    });
    return () => cancelAnimationFrame(id);
  }, [pendingFocus]);




  function continueToPayment() {
    if (reportErrors(validateAddress(), "address")) return;
    saveCheckoutProgress();

    trackFunnelEvent("InitiateCheckout", {
      medication: state.med,
      medication_name: med.name,
      plan_id: plan.id,
      plan_label: plan.label,
      product_id: product.productId,
      value: Number(payable.toFixed(2)),
      coupon: coupon?.code?.toUpperCase(),
      currency: "USD",
    });
    saveLeadNow({ stage: "checkout_started", state: shipState });

    setStage("payment");
    saveLeadNow({ stage: "payment_step" });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, left: 0 });
  }




  /** Hands a stuck order to the team instead of losing the sale. */
  function requestAssistedOrder() {
    setAssistSent(true);
    setExitPrompt(false);
    saveCheckoutProgress();
    void logOrderFailure({
      data: {
        sessionId: leadSessionId() ?? undefined,
        email: email.trim() || undefined,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.replace(/\D/g, "") || undefined,
        state: shipState || undefined,
        medication: state.med,
        planId: plan.id,
        productId: product.productId,
        couponCode: coupon?.code ?? undefined,
        amount: Number(payable.toFixed(2)),
        reason: "Customer asked our team to complete the order by phone.",
      },
    }).catch(() => {
      /* never block the shopper */
    });
    trackGa4("checkout_assist_requested", { medication: state.med, plan_id: plan.id });
    toast.success("Saved. Our team will call you to finish this order.");
  }


  /** Creates the payment session. The amount is resolved on the server —
   *  live pricing plus a re-validated coupon — never from the client total. */
  async function startPayment() {
    if (placing || clientSecret || orderCompletedRef.current) return;
    // Re-check the delivery screen in case details changed since leaving it.
    const errs = validateAddress();
    if (Object.values(errs).some(Boolean)) {
      setStage("address");
      reportErrors(errs, "address");
      return;
    }

    let environment: "sandbox" | "live";
    try {
      environment = getStripeEnvironment();
    } catch {
      setPayErrors({ form: "Online payment isn't set up for this site yet. Please call us at +1 877 361 8113 to complete your order." });
      return;
    }

    setPlacing(true);
    setPayErrors({});
    setPaymentAttempted(true);
    saveLeadNow({ stage: "payment_attempt" });
    trackGa4("checkout_payment_attempt", { medication: state.med, plan_id: plan.id, value: Number(payable.toFixed(2)) });

    const res = await createSessionFn({
      data: {
        sessionId: leadSessionId() ?? undefined,
        environment,
        med: state.med,
        planId: plan.id,
        couponCode: coupon?.valid ? coupon.code : undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.replace(/\D/g, ""),
        street: street.trim(),
        apt: apt.trim() || undefined,
        city: city.trim(),
        state: shipState,
        zip: zip.trim(),
        dob,
        gender: gender === "female" ? "female" : "male",
        ...medicalAnswers(state),
        returnUrl: `${window.location.origin}/checkout?payment=return&session_id={CHECKOUT_SESSION_ID}`,
      },
    });
    setPlacing(false);

    if ("error" in res) {
      setFailedAttempts((n) => n + 1);
      setPayErrors({ form: res.error });
      toast.error(res.error);
      saveLeadNow({ stage: "payment_step" });
      trackGa4("checkout_order_failed", {
        reason: res.error.slice(0, 100),
        medication: state.med,
        plan_id: plan.id,
        value: Number(payable.toFixed(2)),
      });
      void logOrderFailure({
        data: {
          sessionId: leadSessionId() ?? undefined,
          email: email.trim() || undefined,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          phone: phone.replace(/\D/g, "") || undefined,
          state: shipState || undefined,
          medication: state.med,
          planId: plan.id,
          productId: product.productId,
          couponCode: coupon?.code ?? undefined,
          amount: Number(payable.toFixed(2)),
          reason: res.error.slice(0, 400),
        },
      }).catch(() => {
        /* logging must never block the shopper */
      });
      return;
    }

    if (res.mode === "free") {
      // A code covered the whole amount — no payment step needed.
      orderCompletedRef.current = true;
      setOrderNumber(res.orderNumber);
      saveLeadNow({ stage: "ordered" });
      trackFunnelEvent("Purchase", {
        medication: state.med,
        medication_name: med.name,
        plan_id: plan.id,
        plan_label: plan.label,
        product_id: product.productId,
        order_id: res.orderNumber,
        value: 0,
        coupon: coupon?.code?.toUpperCase(),
        currency: "USD",
      });
      setStage("done");
      if (typeof window !== "undefined") window.scrollTo({ top: 0, left: 0 });
      return;
    }

    setOrderNumber(res.orderNumber);
    setClientSecret(res.clientSecret);
  }


  // Return flow: the payment provider redirects back with a session id; poll
  // our records until the payment is confirmed, then show the done screen.
  const returnSessionId = search.payment === "return" ? (search.session_id ?? null) : null;
  useEffect(() => {
    if (!returnSessionId || orderCompletedRef.current) return;
    setReturnPolling(true);
    setReturnFailed(false);
    let cancelled = false;
    let attempts = 0;
    const finish = (finishedOrderNumber: string, total: number) => {
      orderCompletedRef.current = true;
      setOrderNumber(finishedOrderNumber);
      saveLeadNow({ stage: "ordered" });
      const s = readFunnel();
      const resolved = resolvePlan(s);
      trackFunnelEvent("Purchase", {
        medication: s.med,
        medication_name: resolved.med.name,
        plan_id: resolved.plan.id,
        plan_label: resolved.plan.label,
        product_id: productFor(s.med, resolved.plan.id).productId,
        order_id: finishedOrderNumber,
        value: Number(total.toFixed(2)),
        currency: "USD",
      });
      setReturnPolling(false);
      setStage("done");
      if (typeof window !== "undefined") window.scrollTo({ top: 0, left: 0 });
    };
    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await statusFn({ data: { sessionId: returnSessionId } });
        if (res.found && res.status === "paid") {
          finish(res.orderNumber, res.total);
          return;
        }
        if (res.found && res.status === "payment_failed") {
          setReturnPolling(false);
          setReturnFailed(true);
          return;
        }
      } catch {
        /* keep polling */
      }
      if (attempts < 60) {
        window.setTimeout(tick, 3000);
      } else {
        setReturnPolling(false);
        setReturnFailed(true);
      }
    };
    void tick();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnSessionId]);


  const summary = (
    <div className="co-box co-summary">
      <OfferUrgency variant="checkout" />
      <div className="co-eyebrow">ORDER SUMMARY</div>
      <div className="co-prod">
        <img
          src={PRODUCT_IMAGES[state.med] ?? semaVial}
          alt={`${product.name} vial`}
          loading="lazy"
          decoding="async"
          style={{ width: 64, height: 78, objectFit: "contain", flex: "none", display: "block" }}
        />

        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>{product.name}</div>
          <div className="lx-muted" style={{ fontSize: ".8rem" }}>
            Product ID {product.productId} ·{" "}
            {discount > 0 ? (
              <>
                <s style={{ opacity: 0.6 }}>{money(live.monthly)}</s>{" "}
                <strong style={{ color: "var(--burgundy)" }}>
                  {money(payable / Math.max(1, Number(plan.id)))}
                </strong>
                /mo
              </>
            ) : (
              <>{money(live.monthly)}/mo</>
            )}
          </div>
          <div style={{ color: "var(--burgundy)", fontSize: ".8rem" }}>
            ✓ Includes {plan.id} month{plan.id === "1" ? "" : "s"} of medication, provider visit, shipping and 24/7 care
          </div>

        </div>
        <div style={{ marginLeft: "auto", fontWeight: 800, color: "var(--burgundy)", textAlign: "right" }}>
          {discount > 0 ? (
            <>
              <s style={{ display: "block", fontWeight: 500, opacity: 0.55, fontSize: ".85rem" }}>{money(subtotal)}</s>
              {money(payable)}
            </>
          ) : (
            money(subtotal)
          )}
        </div>

      </div>

      <div
        style={{
          margin: "12px 0",
          padding: "14px 0",
          borderTop: "1px solid rgba(0,0,0,.08)",
          borderBottom: "1px solid rgba(0,0,0,.08)",
        }}
      >
        {coupon?.valid ? (
          <div className="lx-muted" style={{ fontSize: ".85rem", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "var(--burgundy)", fontWeight: 700 }}>
              Code {(coupon.code ?? "").toUpperCase()} applied
            </span>
            <button
              type="button"
              onClick={() => { setCoupon(null); setCouponInput(""); setCouponError(null); setClientSecret(null); }}
              style={{ background: "none", border: "none", padding: 0, textDecoration: "underline", cursor: "pointer", color: "inherit", font: "inherit" }}
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <div className="co-coupon-row" style={{ display: "flex", gap: 12 }}>
              <input
                placeholder="Coupon code"
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value); setCouponError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void applyCoupon(); } }}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  padding: "12px 20px",
                  border: "1px solid rgba(0,0,0,.12)",
                  background: "rgba(0,0,0,.015)",
                }}
              />
              <button
                type="button"
                disabled={couponBusy}
                onClick={() => void applyCoupon()}
                style={{
                  borderRadius: 999,
                  padding: "12px 26px",
                  border: "1px solid rgba(0,0,0,.12)",
                  background: "transparent",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {couponBusy ? "Checking..." : "Apply"}
              </button>
            </div>
            {couponError && (
              <p style={{ color: "var(--burgundy)", fontSize: ".82rem", margin: "6px 0 0" }}>{couponError}</p>
            )}
          </>
        )}
      </div>


      <div className="co-saved-band">
        <strong>{money(todaysOff + discount)} SAVED TODAY</strong>
        <span>Discount applied to your order</span>
      </div>

      <div className="co-incl">
        <div className="co-incl-row">
          <span className="co-incl-ico" aria-hidden="true">🩺</span>
          <div>
            <div className="co-incl-t">24/7 Doctor Support</div>
            <div className="co-incl-d">Secure messaging with your provider anytime</div>
          </div>
          <div className="co-incl-p"><s>$99</s><b>Free</b></div>
        </div>
        <div className="co-incl-row">
          <span className="co-incl-ico" aria-hidden="true">🚚</span>
          <div>
            <div className="co-incl-t">Shipping</div>
            <div className="co-incl-d">Cold packed and shipped safely to your door</div>
          </div>
          <div className="co-incl-p"><s>$49</s><b>Free</b></div>
        </div>
        <div className="co-incl-row">
          <span className="co-incl-ico" aria-hidden="true">📦</span>
          <div>
            <div className="co-incl-t">Supplies</div>
            <div className="co-incl-d">All supplies included (sterile syringes &amp; swabs)</div>
          </div>
          <div className="co-incl-p"><s>$60</s><b>Free</b></div>
        </div>
      </div>

      <button type="button" className="co-total-toggle" onClick={() => setBreakdownOpen((v) => !v)}>
        <span aria-hidden="true">{breakdownOpen ? "▲" : "▼"}</span>
        Today's total: <b>{money(payable)}</b>
      </button>

      {breakdownOpen && (
        <div className="co-breakdown">
          {discount > 0 && (
            <div className="summary-row">
              <span>Discount applied</span>
              <span style={{ color: "var(--burgundy)" }}>-{money(discount)}</span>
            </div>
          )}
          <div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="summary-row"><span>Estimated Tax</span><span>$0</span></div>
          <div className="summary-row"><span>Shipping</span><span>$0</span></div>
          <div className="summary-row total">
            <span>Total</span>
            <span>
              {discount > 0 && <s className="was">{money(subtotal)}</s>}{" "}
              <b style={{ color: "var(--burgundy)" }}>{money(payable)}</b>
            </span>
          </div>
        </div>
      )}


    </div>
  );

  if (stage === "done") {
    return (
      <FunnelShell pct={100} wide hideTrust>
        <div className="ty-wrap">
          <img src={logo} alt="LegacyRx" className="ty-logo" />
          <div className="ty-check">✓</div>
          <h1 className="ty-title">ORDER SUCCESSFUL!</h1>
          <p className="ty-lead">
            Thank you for your purchase! Your order{orderNumber ? ` #${orderNumber}` : ""} has been confirmed and a
            confirmation email has been sent to you.
          </p>
          <div className="ty-pill">✓ Order Confirmed</div>

          <div className="ty-steps">
            {[
              ["1", "Check Your Email", "Look for member portal credentials in your email inbox"],
              ["2", "Login to Portal", "Use your credentials to access your member portal"],
              ["3", "Complete Forms", "Fill out your medical consultation forms"],
            ].map(([n, title, copy]) => (
              <div className="ty-card" key={n}>
                <div className="ty-num">{n}</div>
                <div className="ty-card-title">{title}</div>
                <p className="ty-card-copy">{copy}</p>
              </div>
            ))}
          </div>

          <a
            className="btn btn-primary ty-portal"
            href="https://member.legacyrx.net"
            target="_blank"
            rel="noopener noreferrer"
          >
            Access Member Portal ↗
          </a>

          <div className="ty-panel">
            <div className="ty-panel-title">Member Portal Access</div>
            <p className="ty-panel-copy">
              Your member portal credentials have been sent to: <strong>{email}</strong>
            </p>
            <p className="ty-panel-note">
              If you don't see the email, please check your spam folder or contact our support team.
            </p>
          </div>

          <h2 className="ty-why">Why Choose LegacyRx?</h2>
          <div className="ty-steps">
            {[
              ["✓", "Secure & Private", "Your information is protected with bank-level security"],
              ["✈", "Fast Delivery", "Fast shipping on all orders with tracking"],
              ["★", "Premium Support", "Reliable customer support with medical consultation included"],
            ].map(([icon, title, copy]) => (
              <div className="ty-card ty-card-alt" key={title}>
                <div className="ty-icon">{icon}</div>
                <div className="ty-card-title">{title}</div>
                <p className="ty-card-copy">{copy}</p>
              </div>
            ))}
          </div>

          <div className="ty-panel">
            <div className="ty-panel-title">Need Help?</div>
            <p className="ty-panel-copy">Our support team is here to help you with any questions or concerns.</p>
            <p className="ty-panel-copy">
              <a href="mailto:support@legacyrx.net">support@legacyrx.net</a>
            </p>
          </div>
        </div>
      </FunnelShell>
    );
  }

  if (returnSessionId && !returnFailed) {
    return (
      <FunnelShell pct={100} wide hideTrust>
        <div className="co-box" style={{ textAlign: "center", padding: 48 }}>
          <div className="co-eyebrow">CHECKOUT</div>
          <h3 style={{ marginTop: 4 }}>Processing your payment…</h3>
          <p className="lx-muted">Please wait while we confirm your payment. This usually takes only a moment.</p>
        </div>
      </FunnelShell>
    );
  }

  if (returnSessionId && returnFailed) {
    return (
      <FunnelShell pct={100} wide hideTrust>
        <div className="co-box" style={{ textAlign: "center", padding: 48 }}>
          <div className="co-eyebrow">CHECKOUT</div>
          <h3 style={{ marginTop: 4 }}>We couldn't confirm your payment yet</h3>
          <p className="lx-muted">
            If your payment went through, your order is already being processed — our team will confirm it shortly.
            If not, call us and we'll complete the order together.
          </p>
          <a className="btn btn-ghost" href="tel:+18773618113">Call +1 877 361 8113</a>
          <p className="lx-muted" style={{ marginTop: 12 }}>
            Or email <a href="mailto:tclegacyrx@gmail.com">tclegacyrx@gmail.com</a>.
          </p>
        </div>
      </FunnelShell>
    );
  }

  return (
    <FunnelShell pct={100} wide>
      <PaymentTestModeBanner />
      <div className={`co-grid${stage === "address" ? " co-grid-summary-first" : ""}`} style={{ paddingBottom: 88 }}>
        {stage === "address" ? (
          <div className="co-box">
            <div className="co-eyebrow">CHECKOUT · STEP 1 OF 2</div>
            <h3 style={{ marginTop: 4 }}>Delivery address</h3>
            <div className="lx-muted" style={{ fontSize: ".85rem", marginBottom: 12 }}>
              Discreet packaging, free overnight shipping.
            </div>
            <div className="co-trust-strip">
              <span>✓ Licensed US providers</span>
              <span>✓ HIPAA compliant</span>
              <span>✓ Full refund if not approved</span>
            </div>
            {usedSavedAddress && (
              <p className="lx-muted" style={{ fontSize: ".8rem", margin: "10px 0 0" }}>
                We filled in your last delivery address — please check it before continuing.
              </p>
            )}

            {(contactGaps.email || errors.email) && (
              <div className="field">
                <label>Email</label>
                <input ref={fieldRefs.email} type="email" autoComplete="email" placeholder="you@example.com" value={email} className={errCls(errors.email)} aria-invalid={!!errors.email} onBlur={saveCheckoutProgress} onChange={(e) => { setEmail(e.target.value); clearError("email"); }} />
                <FieldError msg={errors.email} />
              </div>
            )}
            {(contactGaps.name || errors.firstName || errors.lastName) && (
              <div className="lx-grid grid-2">
                <div className="field">
                  <label>First Name</label>
                  <input ref={fieldRefs.firstName} autoComplete="given-name" placeholder="First name" value={firstName} className={errCls(errors.firstName)} aria-invalid={!!errors.firstName} onBlur={saveCheckoutProgress} onChange={(e) => { setFirstName(e.target.value); clearError("firstName"); }} />
                  <FieldError msg={errors.firstName} />
                </div>
                <div className="field">
                  <label>Last Name</label>
                  <input ref={fieldRefs.lastName} autoComplete="family-name" placeholder="Last name" value={lastName} className={errCls(errors.lastName)} aria-invalid={!!errors.lastName} onBlur={saveCheckoutProgress} onChange={(e) => { setLastName(e.target.value); clearError("lastName"); }} />
                  <FieldError msg={errors.lastName} />
                </div>
              </div>
            )}
            {(contactGaps.phone || errors.phone) && (
              <div className="field">
                <label>Phone</label>
                <input ref={fieldRefs.phone} placeholder="5551234567" value={phone} inputMode="numeric" maxLength={10} autoComplete="tel" className={errCls(errors.phone)} aria-invalid={!!errors.phone} onBlur={saveCheckoutProgress} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); clearError("phone"); }} />
                <FieldError msg={errors.phone} />
              </div>
            )}

            <div className="lx-grid grid-2">
              <div className="field">
                <label>Date of birth</label>
                <input
                  ref={fieldRefs.dob}
                  placeholder="MM/DD/YYYY"
                  value={dob}
                  inputMode="numeric"
                  autoComplete="bday"
                  className={errCls(errors.dob)} aria-invalid={!!errors.dob}
                  onChange={(e) => { setDob(formatDob(e.target.value)); clearError("dob"); }}
                />
                <FieldError msg={errors.dob} />
              </div>
              <div className="field">
                <label>Biological sex</label>
                <select ref={fieldRefs.gender} value={gender} className={errCls(errors.gender)} aria-invalid={!!errors.gender} onChange={(e) => { setGender(e.target.value); clearError("gender"); }}>
                  <option value="" disabled>Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <FieldError msg={errors.gender} />
              </div>
            </div>

            <div className="field">
              <label>Street Address</label>
              <input ref={fieldRefs.street} autoComplete="address-line1" placeholder="123 Main St" value={street} className={errCls(errors.street)} aria-invalid={!!errors.street} onChange={(e) => { setStreet(e.target.value); clearError("street"); }} />
              <FieldError msg={errors.street} />
            </div>
            <p className="lx-muted" style={{ fontSize: ".78rem", margin: "-8px 0 12px" }}>We cannot ship to PO boxes.</p>
            <div className="field">
              <label>Apt / Suite (optional)</label>
              <input placeholder="Apt 4B" autoComplete="address-line2" value={apt} onChange={(e) => setApt(e.target.value)} />
            </div>
            <div className="lx-grid co-grid-3">
              <div className="field">
                <label>City</label>
                <input ref={fieldRefs.city} autoComplete="address-level2" placeholder="City" value={city} className={errCls(errors.city)} aria-invalid={!!errors.city} onChange={(e) => { setCity(e.target.value); clearError("city"); }} />
                <FieldError msg={errors.city} />
              </div>
              <div className="field">
                <label>State</label>
                <select ref={fieldRefs.shipState} autoComplete="address-level1" value={shipState} className={errCls(errors.shipState)} aria-invalid={!!errors.shipState} onChange={(e) => { setShipState(e.target.value); clearError("shipState"); }}>
                  <option value="" disabled>Select</option>
                  {stateOptions.map((s) => <option key={s.code}>{s.name}</option>)}
                </select>
                <FieldError msg={errors.shipState} />
              </div>
              <div className="field">
                <label>ZIP Code</label>
                <input
                  ref={fieldRefs.zip}
                  placeholder="10001"
                  value={zip}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={5}
                  className={errCls(errors.zip)} aria-invalid={!!errors.zip}
                  onChange={(e) => {
                    const next = e.target.value.replace(/\D/g, "").slice(0, 5);
                    setZip(next);
                    clearError("zip");
                    if (next.length === 5) void lookupZip(next);
                  }}
                />
                <FieldError msg={errors.zip} />
              </div>
            </div>


            {Object.values(errors).some(Boolean) && (
              <p className="cofield-summary" role="alert">Please complete the fields marked in red above.</p>

            )}
          </div>
        ) : (
          <>
          <div className="co-box">
            <div className="co-eyebrow">CHECKOUT · STEP 2 OF 2</div>
            <h3 style={{ marginTop: 4, marginBottom: 10 }}>Payment</h3>

            {/* Order recap, so the item and total stay in view beside the payment form. */}
            <div className="co-pay-recap">
              <div>
                <strong>{product.name}</strong>
                <span>{plan.label} · {money(payable / Math.max(1, Number(plan.id)))}/mo</span>
              </div>
              <div className="co-pay-recap-total">
                <span>Total today</span>
                <strong>{money(payable)}</strong>
              </div>
            </div>
            <p className="co-pay-reserved">🔖 This price is reserved for you while you finish this page.</p>

            <div className="co-pay-assure">
              <strong>{isFree ? "No charge today - your coupon covers the full amount." : "You're charged today. Full refund if you're not approved."}</strong>

              <span>{isFree ? "We start your provider review right away - nothing is charged today." : "A licensed provider reviews your request usually within 1 day. If it isn't approved, we refund you in full."}</span>
              <ul className="co-pay-assure-list">
                <li>Encrypted with 256-bit SSL - payment handled by our secure processor</li>
                <li>Cancel any time - no membership fee and no price rise after month 1</li>
                <li>30-day return window on unopened, non-prescription items</li>
              </ul>
            </div>

            {clientSecret ? (
              <StripeEmbeddedCheckout clientSecret={clientSecret} />
            ) : (
              <>
                {payErrors.form && (
                  <div className="co-payfail" role="alert">
                    <strong>{payErrors.form}</strong>
                    <span>
                      Your card has not been charged. Please try again
                      {failedAttempts > 1 ? ", or let our team finish the order for you." : "."}
                    </span>
                    <div className="co-payfail-actions">
                      <button type="button" className="btn btn-primary" onClick={() => void startPayment()} disabled={placing}>
                        {placing ? "Trying again..." : "Try again"}
                      </button>
                      <a className="btn btn-ghost" href="tel:+18773618113">Call +1 877 361 8113</a>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ width: "100%", marginTop: 8 }}
                      onClick={requestAssistedOrder}
                      disabled={assistSent}
                    >
                      {assistSent ? "✓ Team notified - we'll call you" : "Have our team finish my order by phone"}
                    </button>
                    <span className="co-payfail-help">
                      Prefer email? <a href="mailto:tclegacyrx@gmail.com">tclegacyrx@gmail.com</a> — we'll complete your order and confirm by reply.
                    </span>
                  </div>
                )}

                <p className="co-pay-help">
                  Stuck or prefer a person? Call <a href="tel:+18773618113">+1 877 361 8113</a> or email{" "}
                  <a href="mailto:tclegacyrx@gmail.com">tclegacyrx@gmail.com</a>.
                </p>

                <ul className="co-next-steps">
                  <li>You're charged when you complete payment — full refund if a licensed provider doesn't approve your request.</li>
                  <li>
                    Auto-renews after your {plan.id}-month plan at {money(MED_INFO[state.med].renewal)}/month until you cancel.
                    Cancel anytime from <a href="/account">My account</a>.
                  </li>
                  <li>A licensed provider reviews your request usually within 1 day.</li>
                  <li>Next-day delivery in discreet packaging once approved.</li>
                </ul>
              </>
            )}
        </div>

        {/* One quiet rescue when payment has started and the shopper looks away. */}
        {stage === "payment" && exitPrompt && (
          <div className="co-exit-backdrop" role="dialog" aria-modal="true" aria-label="Finish your order">
            <div className="co-exit">
              <button type="button" className="co-exit-x" aria-label="Close" onClick={() => setExitPrompt(false)}>
                ×
              </button>
              <p className="co-exit-kicker">Hold on — your order is nearly done</p>
              <h2>Keep your reserved price</h2>
              <p className="co-exit-copy">
                Finish now to lock in today&apos;s total of <b>{money(payable)}</b>. You're charged today and
                refunded in full if a licensed provider doesn&apos;t approve your request.
              </p>
              <button type="button" className="btn btn-primary" onClick={() => setExitPrompt(false)}>
                Finish my order
              </button>
              {assistSent ? (
                <p className="co-exit-note">✓ Saved. Our team will call you shortly to complete this order.</p>
              ) : (
                <button type="button" className="btn btn-ghost" style={{ marginTop: 8 }} onClick={requestAssistedOrder}>
                  Have our team finish my order by phone
                </button>
              )}
              <p className="co-exit-help">
                Need help now? Call <a href="tel:+18773618113">+1 877 361 8113</a>
              </p>
            </div>
          </div>
        )}
          </>
        )}



        <div className="funnel-sticky-bar">
          {stage === "address" ? (
            <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={continueToPayment} disabled={placing}>
              {errorCount > 0
                ? `Fix ${errorCount} field${errorCount > 1 ? "s" : ""} to continue`
                : "Continue to payment →"}
            </button>
          ) : clientSecret ? null : (
            <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => void startPayment()} disabled={placing}>
              {placing ? "Processing..." : "Complete my order"}
            </button>
          )}
        </div>





        {summary}
      </div>


      <div className="co-box" style={{ marginTop: 16, padding: 18 }}>
        <TrustBadges />
      </div>

      <p className="ssl">🔒 256-bit SSL encryption • Your card is never stored</p>
    </FunnelShell>
  );
}
