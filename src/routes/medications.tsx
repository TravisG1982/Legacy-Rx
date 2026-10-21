import { createFileRoute, Link } from "@tanstack/react-router";
import { CtaBand } from "../components/Brand";
import { useFromPrices } from "@/hooks/use-live-prices";
import semaVial from "../assets/semaglutide-vial.webp";
import tirzVial from "../assets/tirzepatide-vial.webp";

export const Route = createFileRoute("/medications")({
  head: () => ({
    meta: [
      { title: "Compounded Tirzepatide & Semaglutide Online - LegacyRX" },
      { name: "description", content: "Get compounded tirzepatide and semaglutide online, prescribed by U.S.-licensed providers. Flat monthly pricing, discreet delivery." },
      { property: "og:title", content: "Compounded Tirzepatide & Semaglutide Online - LegacyRX" },
      { property: "og:description", content: "Compounded tirzepatide and semaglutide online at one flat monthly price." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MedicationsPage,
});

function MedicationsPage() {
  const { semaText, tirzText } = useFromPrices();
  return (
    <>
      <section className="lx">
        <div className="container-lx">
          <div style={{ textAlign: "center" }}>
            <p className="eyebrow">Choose Your Medication</p>
            <h1>Compounded GLP-1 Treatment</h1>
            <p className="lead">
              Doctor-prescribed compounded GLP-1 with flat monthly pricing. Final eligibility is determined by a licensed provider.
            </p>
          </div>
          <div className="lx-grid grid-2" style={{ marginTop: 40 }}>
            <div className="lx-card">
              <div className="img-slot" style={{ marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}><img loading="lazy" decoding="async" src={semaVial} alt="Compounded Semaglutide vial" style={{ maxHeight: 300, width: "auto", objectFit: "contain" }} /></div>
              <h3>Compounded Semaglutide - {semaText}/month</h3>
              <p className="lx-muted">
                A GLP-1 receptor agonist that helps regulate appetite and blood sugar, supporting gradual, sustained
                weight management. Flat monthly pricing.
              </p>
              <Link className="btn btn-primary" to="/qualify">See if you qualify</Link>
            </div>
            <div className="lx-card">
              <div className="img-slot" style={{ marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}><img loading="lazy" decoding="async" src={tirzVial} alt="Compounded Tirzepatide vial" style={{ maxHeight: 300, width: "auto", objectFit: "contain" }} /></div>
              <h3>Compounded Tirzepatide - {tirzText}/month</h3>
              <p className="lx-muted">
                A dual agonist that activates both GLP-1 and GIP receptors, offering maximum savings &amp; results for
                eligible patients. Flat monthly pricing.
              </p>
              <Link className="btn btn-ghost" to="/qualify">See if you qualify</Link>
            </div>
          </div>
          <div className="legal" style={{ marginTop: 34, maxWidth: "none" }}>
            <div className="callout">
              <p className="lx-muted" style={{ margin: 0, fontSize: ".85rem" }}>
                <strong>About the medication.</strong> Compounded semaglutide and tirzepatide are not FDA-approved. The
                FDA does not evaluate compounded medications for safety, effectiveness, or quality. Semaglutide and
                tirzepatide are the active ingredients also found in some FDA-approved branded products; compounded
                versions are different from those branded products. Prescriptions are issued only after an online
                consultation with an independent licensed provider.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="lx" style={{ background: "var(--cream-warm)" }}>
        <div className="container-lx">
          <div style={{ textAlign: "center" }}>
            <p className="eyebrow">How it works</p>
            <h2>3 Steps. Under 5 Minutes.</h2>
            <p className="lead">Quick online assessment, clinician review, then discreet delivery.</p>
          </div>
          <div className="lx-grid grid-3" style={{ marginTop: 40 }}>
            {[
              ["01", "Take the health assessment", "Complete a confidential 2-minute health assessment about your medical history, current medications, and goals."],
              ["02", "Doctor review", "A licensed provider reviews your information, usually within 1 day. Not everyone qualifies."],
              ["03", "Medication shipped", "If prescribed, your medication ships from a state-licensed compounding pharmacy with free express shipping."],
            ].map((s, i) => (
              <div key={i} className="lx-card">
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
