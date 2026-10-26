import { Link } from "@tanstack/react-router";
import { CtaBand } from "./Brand";
import { MED_INFO, MEDS, medsForTrack, type ProgramTrack } from "@/lib/legacyrx-data";
import { useLivePrices } from "@/hooks/use-live-prices";
import { PRODUCT_IMAGES } from "@/lib/product-images";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const COPY = {
  trt: {
    eyebrow: "Men's Health",
    title: "Testosterone Therapy (TRT)",
    lead: "Low energy, low drive, stubborn weight or brain fog? A licensed doctor reviews your health online and, if appropriate, prescribes treatment shipped to your door.",
    steps: [
      ["01", "Online health check", "Answer a few confidential questions about your symptoms and medical history."],
      ["02", "Doctor review + labs", "A licensed provider reviews your answers. If you don't have recent blood work, they'll order a simple lab test."],
      ["03", "Treatment shipped", "If prescribed, your medication ships discreetly from a U.S. licensed pharmacy."],
    ],
    legal: "Testosterone is a controlled substance and is prescribed only when medically appropriate after a consultation with an independent licensed provider. Blood work may be required. Compounded medications are not FDA-approved. Not everyone qualifies.",
  },
  hrt: {
    eyebrow: "Women's Health",
    title: "Menopause & Hormone Therapy (HRT)",
    lead: "Hot flashes, poor sleep, mood swings or vaginal dryness? A licensed doctor reviews your health online and, if appropriate, prescribes estrogen therapy shipped to your door.",
    steps: [
      ["01", "Online health check", "Answer a few confidential questions about your symptoms and medical history."],
      ["02", "Doctor review", "A licensed provider reviews your answers, usually within 1 day. Blood work may be requested."],
      ["03", "Treatment shipped", "If prescribed, your cream ships discreetly from a U.S. licensed pharmacy."],
    ],
    legal: "Estrogen therapy carries risks including blood clots, stroke and certain cancers, and is prescribed only when medically appropriate after a consultation with an independent licensed provider. Compounded medications are not FDA-approved. Not everyone qualifies.",
  },
  aa: {
    eyebrow: "Anti-Aging & Longevity",
    title: "Feel and look younger",
    lead: "NAD+ for energy and focus, sermorelin for sleep and recovery, and prescription skin cream for fine lines - reviewed online by a licensed doctor.",
    steps: [
      ["01", "Online health check", "Answer a few confidential questions about your goals and medical history."],
      ["02", "Doctor review", "A licensed provider reviews your answers, usually within 1 day."],
      ["03", "Treatment shipped", "If prescribed, your treatment ships discreetly from a U.S. licensed pharmacy."],
    ],
    legal: "Compounded medications are not FDA-approved and the FDA does not evaluate them for safety, effectiveness or quality. Results vary. Prescribed only when medically appropriate after a consultation with an independent licensed provider. Not everyone qualifies.",
  },
  sh: {
    eyebrow: "Sexual Health",
    title: "ED treatment, delivered discreetly",
    lead: "Generic Viagra (sildenafil) or daily Cialis (tadalafil) prescribed online by a licensed doctor - no waiting rooms, plain packaging.",
    steps: [
      ["01", "Online health check", "Answer a few confidential questions about your health and heart history."],
      ["02", "Doctor review", "A licensed provider reviews your answers, usually within 1 day."],
      ["03", "Shipped in plain packaging", "If prescribed, your pills ship discreetly from a U.S. licensed pharmacy."],
    ],
    legal: "Never take ED medication with nitrates. Seek emergency care for an erection lasting over 4 hours or sudden vision or hearing loss. Prescribed only when medically appropriate after a consultation with an independent licensed provider. Not everyone qualifies.",
  },
} as const;

export function HormoneProgram({ track }: { track: ProgramTrack }) {
  const c = COPY[track];
  const { price } = useLivePrices();
  const meds = medsForTrack(track);
  return (
    <>
      <section className="lx">
        <div className="container-lx">
          <div style={{ textAlign: "center" }}>
            <p className="eyebrow">{c.eyebrow}</p>
            <h1>{c.title}</h1>
            <p className="lead">{c.lead}</p>
          </div>
          {meds.length === 0 && (
            <div className="lx-card" style={{ marginTop: 40, maxWidth: 520, marginInline: "auto", textAlign: "center" }}>
              <h3>Coming soon</h3>
              <p className="lx-muted">This program isn't available to order yet. Explore our other treatments in the meantime.</p>
              <Link className="btn btn-primary" to="/medications">See available treatments</Link>
            </div>
          )}
          <div className={`lx-grid ${meds.length > 2 ? "grid-3" : meds.length === 2 ? "grid-2" : ""}`} style={{ marginTop: 40, maxWidth: meds.length > 1 ? undefined : 520, marginInline: "auto" }}>
            {meds.map((k) => {
              const three = price(k, "3");
              const one = price(k, "1");
              return (
                <div key={k} className="lx-card" style={{ display: "flex", flexDirection: "column" }}>
                  <div className="img-slot" style={{ marginBottom: 18, overflow: "hidden" }}>
                    <img loading="lazy" decoding="async" src={PRODUCT_IMAGES[k]} width={1024} height={1024} alt={MEDS[k].name} style={{ width: "100%", height: 260, objectFit: "cover" }} />
                  </div>
                  <h3 style={{ marginBottom: 4 }}>{MEDS[k].name}</h3>
                  <p className="lx-muted" style={{ marginTop: 0 }}>{MED_INFO[k].blurb}</p>
                  {MEDS[k].plans.some((p) => p.id === "3") ? (
                    <p style={{ margin: "6px 0" }}>
                      <b>{money(three.monthly)}/mo</b> <span className="lx-muted">with 3 months ({money(three.total)})</span>
                      <br />
                      <span className="lx-muted" style={{ fontSize: ".88rem" }}>or {money(one.total)} month-to-month</span>
                    </p>
                  ) : (
                    <p style={{ margin: "6px 0" }}><b>{money(one.total)}/mo</b> <span className="lx-muted">month-to-month</span></p>
                  )}
                  {MED_INFO[k].labs && <p className="lx-muted" style={{ fontSize: ".82rem" }}>Blood work required before prescribing.</p>}
                  <div style={{ marginTop: "auto", paddingTop: 10 }}>
                    <Link className="btn btn-primary" to="/qualify" search={{ track, med: k }}>See if you qualify</Link>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="lx-muted" style={{ textAlign: "center", fontSize: ".85rem", marginTop: 18 }}>
            Includes doctor consultation, medication and free shipping.
          </p>
          <div className="legal" style={{ marginTop: 28, maxWidth: "none" }}>
            <div className="callout">
              <p className="lx-muted" style={{ margin: 0, fontSize: ".85rem" }}>
                <strong>Important.</strong> {c.legal}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="lx" style={{ background: "var(--cream-warm)" }}>
        <div className="container-lx">
          <div style={{ textAlign: "center" }}>
            <p className="eyebrow">How it works</p>
            <h2>Simple, private, online</h2>
          </div>
          <div className="lx-grid grid-3" style={{ marginTop: 40 }}>
            {c.steps.map((s) => (
              <div key={s[0]} className="lx-card">
                <div className="step-num">{s[0]}</div>
                <h3 style={{ marginTop: 8 }}>{s[1]}</h3>
                <p className="lx-muted">{s[2]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
