import { createFileRoute, Link } from "@tanstack/react-router";
import { TrustBadges } from "../components/TrustBadges";
import { Faq } from "../components/Faq";
import heroImage from "../assets/legacy-rx-hero.webp.asset.json";
import semaVial from "../assets/semaglutide-vial.webp.asset.json";
import tirzVial from "../assets/tirzepatide-vial.webp.asset.json";
import { CtaBand } from "../components/Brand";
import { FAQS } from "../lib/legacyrx-data";
import { useFromPrices } from "@/hooks/use-live-prices";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LegacyRX | Physician-Led Medical Weight Loss" },
      { name: "description", content: "Doctor-Guided GLP-1 Care, Built to Last. Compounded Semaglutide from $168.90/mo with flat monthly pricing." },
      { property: "og:title", content: "LegacyRX | Physician-Led Medical Weight Loss" },
      { property: "og:description", content: "Doctor-Guided GLP-1 Care, Built to Last. Flat monthly pricing." },
    ],
    links: [
      { rel: "preload", as: "image", href: heroImage.url, fetchPriority: "high" },
    ],
  }),
  component: HomePage,
});

const WHY: [string, string, string][] = [
  ["🩺", "Real Physicians, Real Pharmacy", "A licensed provider evaluates your information and recommends a plan; medication is filled by U.S.-based, state-licensed pharmacies."],
  ["💲", "Simple Flat Pricing. No Catch.", "Flat monthly pricing with no hidden fees and no membership charges."],
  ["🚚", "Fast, Free Delivery", "Medication ships directly to your door with free shipping - discreet, cold-chain packaging."],
  ["🔒", "Trusted & HIPAA Compliant", "Your health information is protected with industry-leading security standards."],
  ["💬", "Ongoing Medical Support", "Care-team messaging and provider check-ins for progress and dosage adjustments."],
  ["✅", "Transparent Pricing", "Over $875 in value with every plan - the monthly price is clear up front."],
];

const STEPS: [string, string, string][] = [
  ["01", "Complete a confidential health assessment", "Answer questions about your medical history, current medications, and health goals. Takes about 2 minutes."],
  ["02", "A licensed provider reviews your information", "A clinician licensed in your state reviews your information usually within 1 day and determines whether a GLP-1 medication is clinically appropriate. Not everyone qualifies."],
  ["03", "If prescribed, your medication ships to your door", "Your order is filled by a state-licensed compounding pharmacy with free shipping and ongoing care-team support."],
];

const COMPARE: [string, string, string][] = [
  ["Flat monthly pricing", "✓", "Often dose-tiered"],
  ["No membership fees", "✓", "Frequently charged"],
  ["Free shipping included", "✓", "Sometimes extra"],
  ["Clinician review, usually within 1 day", "✓", "Varies"],
  ["Transparent pricing upfront", "✓", "Often hidden"],
  ["Cancel anytime", "✓", "Varies"],
];

const TESTIMONIALS: [string, string][] = [
  ["I needed something that actually fit into my busy life. LegacyRX made it easy - the whole process took minutes and my meds showed up at my door.", "Verified patient · California"],
  ["The flat pricing sold me. No surprise charges. Exactly what they promised.", "Verified patient · Texas"],
  ["Having a real provider review everything and check in along the way gave me confidence the whole way through.", "Verified patient · Florida"],
];

function money(n: number) {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

function HomePage() {
  const { sema, tirz } = useFromPrices();
  const semaText = money(sema);
  const tirzText = money(tirz);
  return (
    <>
      <div className="hero">
        <div className="container-lx hero-grid hero-grid-pad">
          <div>
            <p className="hero-tagline">Building a Healthier Legacy.</p>
            <h1>Doctor-Guided GLP-1 Care, Built to Last.</h1>
            <p className="lead" style={{ marginLeft: 0 }}>
              The most accessible GLP-1 plans online. Simple, flat monthly pricing - because your care shouldn't come with surprises.
            </p>
            <ul className="hero-points">
              <li>Doctor-prescribed compounded Semaglutide &amp; Tirzepatide</li>
              <li>Flat monthly pricing - no hidden fees, no memberships</li>
              <li>Free shipping from U.S.-licensed pharmacies</li>
            </ul>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link className="btn btn-primary btn-lg" to="/qualify">Get started →</Link>
              <Link className="btn btn-ghost btn-lg" to="/how-it-works">How it works</Link>
            </div>
          </div>
          <div className="hero-media">
            <img fetchPriority="high" decoding="async" src={heroImage.url} alt="LegacyRx community members high-fiving in a park" style={{ width: "100%", height: "auto", borderRadius: 16, display: "block", objectFit: "cover" }} />
            <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
              <TrustBadges />
            </div>
          </div>
        </div>
      </div>


      <div className="disclaimer-band" style={{ background: "var(--cream-warm)" }}>
        <div className="container-lx" style={{ textAlign: "center" }}>
          Telemedicine weight-management programs with licensed clinician oversight. This content is informational and
          does not replace professional medical advice. LegacyRX is available to U.S. adults 18+ in eligible states.
        </div>
      </div>

      <section className="lx">
        <div className="container-lx" style={{ textAlign: "center" }}>
          <p className="eyebrow">Why people choose LegacyRX</p>
          <h2>The Clear Choice for GLP-1 Care</h2>
          <p className="lead">A modern telehealth experience built for clarity, comfort and real clinical guidance.</p>
          <div className="lx-grid grid-3" style={{ marginTop: 40, textAlign: "left" }}>
            {WHY.map((c, i) => (
              <div key={i} className="lx-card">
                <div className="ico">{c[0]}</div>
                <h3>{c[1]}</h3>
                <p className="lx-muted">{c[2]}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32 }}>
            <a href="#pricing" className="btn btn-primary">See our pricing</a>
          </div>
        </div>
      </section>

      <section className="lx manifesto">
        <div className="container-lx" style={{ textAlign: "center" }}>
          <p className="eyebrow" style={{ color: "var(--cream-warm)" }}>Brand Manifesto</p>
          <p className="big">
            "The body is your first legacy. Treat it as a prescription you took out for the next forty years."
          </p>
        </div>
      </section>

      <section className="lx">
        <div className="container-lx">
          <div style={{ textAlign: "center" }}>
            <p className="eyebrow">How it works</p>
            <h2>3 Steps. Under 5 Minutes.</h2>
            <p className="lead">Quick online assessment, clinician review, then discreet delivery.</p>
          </div>
          <div className="lx-grid grid-3" style={{ marginTop: 40 }}>
            {STEPS.map((s, i) => (
              <div key={i} className="lx-card">
                <div className="step-num">{s[0]}</div>
                <h3 style={{ marginTop: 8 }}>{s[1]}</h3>
                <p className="lx-muted">{s[2]}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 34 }}>
            <Link className="btn btn-primary" to="/qualify">See if you qualify</Link>
          </div>
        </div>
      </section>

      <section className="lx" style={{ background: "var(--cream-warm)", paddingBottom: 0 }}>
        <div className="container-lx">
          <div style={{
            background: "#fff",
            borderRadius: 20,
            padding: "56px 44px",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 24,
          }}>
            <div>
              <h2 style={{ fontSize: "clamp(2rem, 4.4vw, 3.2rem)", lineHeight: 1.05, marginBottom: 18 }}>
                Reclaim your best self
              </h2>
              <p style={{ fontSize: "1.05rem", fontWeight: 600, maxWidth: 720, marginBottom: 26 }}>
                Doctor-prescribed GLP-1 weight loss plans from {semaText}/month — flat monthly pricing, zero hidden charges or membership traps.
              </p>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 18,
                marginBottom: 30,
              }}>
                {[
                  "Fast online consultation",
                  "Transparent flat pricing",
                  "U.S.-licensed pharmacies",

                ].map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: "var(--burgundy, #B4232C)", color: "#fff",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 700, flexShrink: 0,
                    }}>✓</span>
                    <span style={{ fontWeight: 600 }}>{t}</span>
                  </div>
                ))}
              </div>
              <Link className="btn btn-primary btn-lg" to="/qualify">Get started →</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="lx" style={{ background: "var(--cream-warm)" }}>

        <div className="container-lx">
          <div style={{ textAlign: "center" }}>
            <p className="eyebrow">Simple monthly pricing</p>
            <h2>Affordable Care. Choose Your Plan</h2>
            <p className="lead">
              Two options, both clinician-reviewed - with clear pricing and no memberships.
            </p>
          </div>
          <div className="plans" style={{ marginTop: 40 }}>
            <div className="plan featured">
              <span className="plan-pill">Most Popular</span>
              <img loading="lazy" decoding="async" src={semaVial.url} alt="Compounded Semaglutide vial" style={{ display: "block", margin: "0 auto 14px", height: 200, width: "auto", objectFit: "contain" }} />
              <h3>Compounded Semaglutide</h3>
              <div className="price">{semaText}<small>/month</small></div>
              <p className="lx-muted" style={{ fontSize: ".9rem" }}>Flat monthly pricing.</p>
              <ul>
                <li>Doctor consultation included</li>
                <li>All monthly doses included</li>
                <li>Free shipping</li>
                <li>Ongoing care-team support</li>
                <li>Transparent pricing</li>
              </ul>
              <Link className="btn btn-primary" style={{ width: "100%" }} to="/qualify">Select Plan</Link>
            </div>
            <div className="plan">
              <img loading="lazy" decoding="async" src={tirzVial.url} alt="Compounded Tirzepatide vial" style={{ display: "block", margin: "0 auto 14px", height: 200, width: "auto", objectFit: "contain" }} />
              <h3>Compounded Tirzepatide</h3>
              <div className="price">{tirzText}<small>/month</small></div>
              <p className="lx-muted" style={{ fontSize: ".9rem" }}>Maximum savings &amp; results.</p>
              <ul>
                <li>Doctor consultation included</li>
                <li>All monthly doses included</li>
                <li>Free shipping</li>
                <li>Ongoing care-team support</li>
                <li>Activates GLP-1 and GIP receptors</li>
              </ul>
              <Link className="btn btn-ghost" style={{ width: "100%" }} to="/qualify">Select Plan</Link>
            </div>
          </div>
          <p className="lx-muted" style={{ textAlign: "center", marginTop: 22, fontSize: ".82rem" }}>
            Prices shown are per month. Every plan includes doctor consultation, medication, and free shipping. Final
            treatment eligibility is determined by a licensed provider.
          </p>
        </div>
      </section>

      <section className="lx">
        <div className="container-lx">
          <div style={{ textAlign: "center" }}>
            <p className="eyebrow">Hormone therapy</p>
            <h2>More than weight loss</h2>
            <p className="lead">Doctor-prescribed hormone treatment, reviewed online and shipped to your door.</p>
          </div>
          <div className="lx-grid grid-2" style={{ marginTop: 32 }}>
            <div className="lx-card">
              <h3>Men's Testosterone (TRT)</h3>
              <p className="lx-muted">Injections, daily cream or enclomiphene pills - from $97/month.</p>
              <Link className="btn btn-primary" to="/mens-health">Explore TRT</Link>
            </div>
            <div className="lx-card">
              <h3>Anti-Aging & Longevity</h3>
              <p className="lx-muted">NAD+, sermorelin and prescription skin cream - from $172.80/month.</p>
              <Link className="btn btn-ghost" to="/anti-aging">Explore Anti-Aging</Link>
            </div>
            <div className="lx-card">
              <h3>Sexual Health (ED)</h3>
              <p className="lx-muted">Sildenafil or daily tadalafil, shipped discreetly - from $253.64/month.</p>
              <Link className="btn btn-ghost" to="/sexual-health">Explore ED treatment</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="lx">
        <div className="container-lx">
          <div style={{ textAlign: "center" }}>
            <p className="eyebrow">No catch</p>
            <h2>See How LegacyRX Compares</h2>
            <p className="lead">See how LegacyRX compares to other GLP-1 providers.</p>
          </div>
          <div className="table-wrap" style={{ marginTop: 24 }}>
            <table className="compare">
              <tbody>
                <tr><th>Feature</th><th>LegacyRX</th><th>Other Providers</th></tr>
                {COMPARE.map((r, i) => (
                  <tr key={i}>
                    <td>{r[0]}</td>
                    <td className="yes">{r[1]}</td>
                    <td className="no">{r[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="lx" style={{ background: "var(--cream-warm)" }}>
        <div className="container-lx">
          <div style={{ textAlign: "center" }}>
            <p className="eyebrow">Verified results from real patients on LegacyRX programs</p>
            <h2>Real Patients. Verified Results.</h2>
          </div>
          <div className="lx-grid grid-3" style={{ marginTop: 36 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="quote">
                <p>"{t[0]}"</p>
                <div className="who">{t[1]}</div>
              </div>
            ))}
          </div>
          <p className="lx-muted" style={{ textAlign: "center", marginTop: 18, fontSize: ".8rem" }}>
            Individual results vary. Eligibility and outcomes are determined in consultation with your licensed provider.
          </p>
        </div>
      </section>

      <section className="lx">
        <div className="container-lx">
          <div style={{ textAlign: "center" }}>
            <p className="eyebrow">Frequently asked questions</p>
            <h2>Questions, Answered</h2>
          </div>
          <div style={{ maxWidth: 780, margin: "30px auto 0" }}>
            <Faq items={FAQS.slice(0, 6)} />
          </div>
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Link className="btn btn-ghost" to="/faq">View all FAQs</Link>
          </div>
        </div>
      </section>


      <section className="lx">
        <div className="container-lx">
          <div style={{
            background: "var(--cream-warm)",
            borderRadius: 24,
            padding: "56px 32px",
            textAlign: "center",
            color: "var(--burgundy)",
          }}>
            <h2 style={{ color: "var(--burgundy)" }}>Get started for just {semaText}/month</h2>
            <p style={{ maxWidth: 620, margin: "0 auto 22px", color: "var(--burgundy)" }}>
              Take our quick 2-minute assessment. A U.S.-licensed clinician reviews your information usually within 1 day. Compounded semaglutide programs from {semaText}/mo*. Not everyone qualifies.
            </p>
            <Link className="btn btn-primary btn-lg" to="/qualify">Get started →</Link>
            <p style={{ fontSize: ".8rem", marginTop: 16, color: "var(--burgundy)", opacity: 0.75 }}>
              🔒 Secure checkout • Cancel anytime • No hidden fees
            </p>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
