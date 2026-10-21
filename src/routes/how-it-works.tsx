import { createFileRoute, Link } from "@tanstack/react-router";
import { CtaBand } from "../components/Brand";
import boxImage from "../assets/legacyrx-box.webp";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works - LegacyRX" },
      { name: "description", content: "Clear steps and hands-on support: 2-minute online assessment, clinician review, then discreet delivery." },
      { property: "og:title", content: "How It Works - LegacyRX" },
      { property: "og:description", content: "Online assessment, clinician review, discreet delivery." },
    ],
  }),
  component: HowItWorksPage,
});

const STEPS: [string, string, string][] = [
  ["01", "Take the health assessment", "Complete a confidential 2-minute health assessment about your medical history, current medications, and goals. This helps us connect you with a licensed provider in your state."],
  ["02", "Doctor review", "A licensed provider reviews your information, usually within 1 day. In some states a video consultation or live chat may be required. If approved, you'll receive an email with prescription details. Not everyone qualifies."],
  ["03", "Medication shipped", "If prescribed, your medication ships from a state-licensed compounding pharmacy with free express shipping - plus ongoing provider check-ins and care-team messaging."],
];

function HowItWorksPage() {
  return (
    <>
      <section className="lx">
        <div className="container-lx">
          <div style={{ textAlign: "center" }}>
            <p className="eyebrow">How It Works</p>
            <h1>Clear Steps, Hands-On Support</h1>
            <p className="lead">
              Clear steps and hands-on support when you need it. Quick online assessment, clinician review, then discreet delivery.
            </p>
          </div>
          <div className="lx-grid grid-3" style={{ marginTop: 44 }}>
            {STEPS.map((s, i) => (
              <div key={i} className="lx-card">
                <div className="step-num">{s[0]}</div>
                <h3 style={{ marginTop: 8 }}>{s[1]}</h3>
                <p className="lx-muted">{s[2]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lx" style={{ background: "var(--cream-warm)" }}>
        <div className="container-lx lx-grid grid-2" style={{ alignItems: "center" }}>
          <img loading="lazy" decoding="async" src={boxImage} alt="LegacyRx branded shipping box" style={{ width: "100%", height: "auto", borderRadius: 16, display: "block", objectFit: "cover" }} />
          <div>
            <h2>Everything Included. No Hidden Costs.</h2>
            <ul className="hero-points">
              <li>Free online medical consultation</li>
              <li>Full medication supply &amp; injection supplies</li>
              <li>Cold-chain, discreet shipping</li>
              <li>Ongoing health monitoring &amp; 24/7 support team</li>
            </ul>
            <Link className="btn btn-primary" to="/qualify">Start assessment →</Link>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
