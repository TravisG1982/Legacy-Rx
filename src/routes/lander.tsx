import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import semaVial from "@/assets/semaglutide-vial.webp";
import tirzVial from "@/assets/tirzepatide-vial.webp";
import brandLogo from "@/assets/legacyrx-burgundy.webp";
import creamLogo from "@/assets/legacyrx-cream.webp";
import { useFromPrices } from "@/hooks/use-live-prices";

export const Route = createFileRoute("/lander")({
  head: () => ({
    meta: [
      { title: "LegacyRX | Doctor-Prescribed GLP-1, From $168.90/mo" },
      {
        name: "description",
        content:
          "Doctor-prescribed compounded GLP-1 - flat monthly pricing. Free shipping, U.S.-licensed clinicians.",
      },
    ],
  }),
  component: LanderPage,
});

const LANDER_CSS = `
.lander-root{font-family:var(--l-body);background:var(--l-bg);color:var(--l-burgundy);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.lander-root{--l-burgundy:#B4232C;--l-deep:#7A1620;--l-soft:#D13B43;--l-ink:#241012;--l-bg:#FFFFFF;--l-warm:#F6F1EA;--l-card:#FAF6F0;--l-line:rgba(180,35,44,.16);--l-muted:#7a5c54;--l-gold:#C48A2C;--l-display:'Fraunces',Georgia,serif;--l-body:'Inter',sans-serif}
.lander-root *{margin:0;padding:0;box-sizing:border-box}
.lander-root h1,.lander-root h2,.lander-root h3,.lander-root h4{font-family:var(--l-display);font-weight:600;line-height:1.1}
.lander-root a{text-decoration:none;color:inherit}
.lander-root .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--l-body);font-weight:700;border-radius:12px;cursor:pointer;border:none;transition:.18s;min-height:54px;padding:16px 34px;font-size:1rem}
.lander-root .btn-primary{background:var(--l-burgundy);color:#fff}
.lander-root .btn-primary:hover{background:var(--l-deep);transform:translateY(-2px)}
.lander-root .btn-out{background:transparent;border:2px solid var(--l-line);color:var(--l-burgundy)}
.lander-root .btn-gold{background:var(--l-gold);color:#fff}
.lander-root .btn-gold:hover{filter:brightness(1.05)}
.lander-root .ubar{background:var(--l-burgundy);color:#fff;text-align:center;padding:11px 16px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
.lander-root .ubar .cd{color:#f4d58a;font-variant-numeric:tabular-nums}
.lander-root .nav{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#fff;border-bottom:1px solid var(--l-line);position:sticky;top:0;z-index:40}
.lander-root .logo{font-family:var(--l-display);font-size:26px;font-weight:600;display:inline-flex;align-items:baseline;gap:.05em}
.lander-root .logo .rx{font-size:.6em;font-weight:500;transform:translateY(-.28em)}
.lander-root .hero{padding:64px 20px 54px;text-align:center;background:radial-gradient(ellipse at 50% 0%,var(--l-warm) 0%,#fff 62%)}
.lander-root .eyebrow{display:inline-flex;align-items:center;gap:8px;background:var(--l-card);border:1px solid var(--l-line);padding:6px 16px;border-radius:100px;font-size:12px;font-weight:700;color:var(--l-soft);text-transform:uppercase;letter-spacing:1px;margin-bottom:22px}
.lander-root .hero h1{font-size:clamp(2.3rem,5.4vw,3.8rem);max-width:780px;margin:0 auto 16px;letter-spacing:-.5px}
.lander-root .hero h1 .pop{color:var(--l-soft)}
.lander-root .hero .sub{font-size:18px;color:#5d3f3a;max-width:560px;margin:0 auto 30px}
.lander-root .cta-note{font-size:13px;color:var(--l-muted);margin-top:10px}
.lander-root .ticker{display:flex;justify-content:center;gap:28px;flex-wrap:wrap;margin-top:34px}
.lander-root .ticker div{font-size:13px;color:var(--l-muted)}
.lander-root .ticker strong{color:var(--l-burgundy)}
.lander-root .sec{padding:70px 20px}
.lander-root .sec.warm{background:var(--l-warm)}
.lander-root .sec-head{text-align:center;max-width:600px;margin:0 auto 44px}
.lander-root .label{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--l-soft);margin-bottom:10px}
.lander-root .sec-head h2{font-size:clamp(1.9rem,3.6vw,2.6rem);margin-bottom:8px}
.lander-root .sec-head p{color:var(--l-muted)}
.lander-root .pgrid{display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:840px;margin:0 auto}
.lander-root .pcard{background:#fff;border:1px solid var(--l-line);border-radius:18px;padding:34px;position:relative}
.lander-root .pcard.hot{border:2px solid var(--l-burgundy);box-shadow:0 20px 50px -28px rgba(180,35,44,.5)}
.lander-root .pbadge{position:absolute;top:-12px;left:30px;background:var(--l-burgundy);color:#fff;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:5px 13px;border-radius:7px}
.lander-root .pbadge.value{background:var(--l-card);color:var(--l-soft)}
.lander-root .pname{font-size:26px;margin-bottom:2px}
.lander-root .ptype{font-size:13px;color:var(--l-muted);margin-bottom:18px}
.lander-root .prow{display:flex;align-items:baseline;gap:8px}
.lander-root .pwas{font-size:19px;color:#b06;opacity:.55;text-decoration:line-through}
.lander-root .pnow{font-family:var(--l-display);font-size:50px;font-weight:700;color:var(--l-burgundy);line-height:1}
.lander-root .pper{color:var(--l-muted)}
.lander-root .psave{display:inline-block;background:#f7ece0;color:var(--l-soft);font-size:12px;font-weight:700;padding:4px 12px;border-radius:6px;margin:12px 0 18px}
.lander-root .pfeat{list-style:none;margin-bottom:20px}
.lander-root .pfeat li{display:flex;gap:10px;padding:6px 0;font-size:14px;color:#5d3f3a}
.lander-root .pfeat .ck{color:var(--l-soft);font-weight:700}
.lander-root .pdose{background:var(--l-card);border-radius:8px;padding:10px 14px;font-size:11px;color:var(--l-muted);text-align:center;margin-bottom:18px}
.lander-root .tstrip{display:flex;justify-content:center;gap:30px;flex-wrap:wrap;padding:26px 20px;background:var(--l-ink);color:rgba(239,230,218,.8)}
.lander-root .tstrip div{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500}
.lander-root .ctable{max-width:800px;margin:0 auto;border:1px solid var(--l-line);border-radius:14px;overflow:hidden}
.lander-root table{width:100%;border-collapse:collapse}
.lander-root .ctable th{background:var(--l-burgundy);color:#fff;padding:14px 18px;font-size:12px;text-transform:uppercase;letter-spacing:.5px;text-align:left}
.lander-root .ctable th:last-child{text-align:center}
.lander-root .ctable td{padding:14px 18px;font-size:14px;border-bottom:1px solid var(--l-line);color:#5d3f3a}
.lander-root .ctable td:last-child{text-align:center;color:var(--l-burgundy);font-weight:700}
.lander-root .ctable tr:last-child td{border-bottom:none}
.lander-root .cbig{font-size:19px;font-weight:700}
.lander-root .cbad{color:#a05}
.lander-root .hgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:880px;margin:0 auto}
.lander-root .hcard{background:#fff;border:1px solid var(--l-line);border-radius:14px;padding:30px 24px;text-align:center}
.lander-root .hnum{width:46px;height:46px;background:var(--l-burgundy);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--l-display);font-weight:700;font-size:18px;margin:0 auto 14px}
.lander-root .hcard h4{font-size:18px;margin-bottom:6px}
.lander-root .hcard p{font-size:14px;color:var(--l-muted)}
.lander-root .rgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:920px;margin:0 auto}
.lander-root .rcard{background:#fff;border:1px solid var(--l-line);border-radius:14px;padding:24px;text-align:left}
.lander-root .stars{color:var(--l-gold);letter-spacing:2px;margin-bottom:12px}
.lander-root .rtext{font-size:14px;color:#5d3f3a;font-style:italic;margin-bottom:16px}
.lander-root .rauthor{display:flex;align-items:center;gap:10px;border-top:1px solid var(--l-line);padding-top:14px}
.lander-root .ravi{width:38px;height:38px;border-radius:50%;background:var(--l-card);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--l-soft);font-size:13px}
.lander-root .rname{font-weight:600;font-size:13px}
.lander-root .rmeta{font-size:11px;color:var(--l-soft)}
.lander-root .ph-note{max-width:920px;margin:18px auto 0;font-size:12px;color:var(--l-muted);text-align:center;font-style:italic}
.lander-root .faq{max-width:700px;margin:0 auto;text-align:left}
.lander-root .faq .item{border-bottom:1px solid var(--l-line);padding:20px 0}
.lander-root .faq .item:first-child{border-top:1px solid var(--l-line)}
.lander-root .faq .q{font-family:var(--l-display);font-size:17px;font-weight:600;margin-bottom:6px}
.lander-root .faq .a{font-size:14px;color:var(--l-muted)}
.lander-root .final{padding:80px 20px;text-align:center;background:var(--l-deep);color:#fff}
.lander-root .final h2{color:#fff;font-size:clamp(2rem,4vw,2.8rem);margin-bottom:12px}
.lander-root .final p{color:rgba(239,230,218,.8);max-width:480px;margin:0 auto 28px}
.lander-root .fprices{display:flex;justify-content:center;gap:40px;margin-top:26px}
.lander-root .fp .m{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:rgba(239,230,218,.6)}
.lander-root .fp .n{font-family:var(--l-display);font-size:28px;font-weight:700;color:#f4d58a}
.lander-root footer{background:var(--l-ink);color:rgba(239,230,218,.5);padding:36px 20px;text-align:center;font-size:11px;line-height:1.7}
.lander-root footer .flogo{font-family:var(--l-display);font-size:22px;color:#fff;margin-bottom:12px}
.lander-root footer .disc{max-width:600px;margin:0 auto 14px}
.lander-root .smob{display:none;position:fixed;bottom:0;left:0;right:0;z-index:60;background:#fff;border-top:1px solid var(--l-line);padding:12px 20px;box-shadow:0 -4px 24px rgba(0,0,0,.12)}
.lander-root .smob .in{display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:480px;margin:0 auto}
.lander-root .smob .pr{font-size:13px;color:var(--l-muted)}
.lander-root .smob .pr strong{font-size:22px;color:var(--l-burgundy)}
@media(max-width:860px){.lander-root .pgrid,.lander-root .hgrid,.lander-root .rgrid{grid-template-columns:1fr}.lander-root .ctable{overflow-x:auto}.lander-root table{min-width:520px}.lander-root .sec{padding:50px 20px}.lander-root .fprices{gap:24px}.lander-root .smob{display:block}.lander-root footer{padding-bottom:84px}.lander-root .ticker{gap:16px}}
`;

const TESTIMONIALS = [
  { quote: "I'd tried so many programs and felt stuck. LegacyRX was simple, my provider was attentive, and the price never changed when my dose did.", name: "Jennifer Mitchell", meta: "Verified patient · Ohio", initial: "J" },
  { quote: "Honest pricing and quick shipping. I appreciated being able to do everything from home without feeling rushed.", name: "Michael Carter", meta: "Verified patient · North Carolina", initial: "M" },
  { quote: "The team made the whole process easy to understand. I felt supported every step and the results have been steady.", name: "Ashley Robinson", meta: "Verified patient · Arizona", initial: "A" },
];

function LanderPage() {
  const { semaText, tirzText } = useFromPrices();
  return (
    <div className="lander-root">
      <style dangerouslySetInnerHTML={{ __html: LANDER_CSS }} />

      <Link to="/qualify" className="ubar" style={{ display: "block", textDecoration: "none", cursor: "pointer" }}>
        Others charge $299–$1,000+/mo for GLP-1s. <span className="cd">LegacyRX starts at {semaText}/mo.</span> All doses included.
      </Link>


      <nav className="nav">
        <img loading="lazy" decoding="async" src={brandLogo} alt="LegacyRX" style={{ height: 36, width: "auto", display: "block" }} />
        <Link to="/qualify" className="btn btn-primary" style={{ minHeight: 44, padding: "11px 22px" }}>
          Get started
        </Link>
      </nav>

      <section className="hero">
        <div className="eyebrow">⚡ Transparent flat pricing</div>
        <h1>GLP-1 Medication From <span className="pop">{semaText}/mo</span></h1>
        <p className="sub">Doctor-prescribed. Flat monthly pricing. No membership traps. Free shipping to your door.</p>
        <Link to="/qualify" className="btn btn-primary">Get started →</Link>
        <div className="cta-note"><strong>2-minute</strong> assessment · No commitment · Not everyone qualifies</div>
        <div className="ticker">
          <div>👥 <strong>147,800+</strong> patients treated</div>
          <div>⭐ <strong>4.8</strong> average rating</div>
          <div>📦 Free shipping</div>
          <div>🔒 HIPAA compliant</div>
        </div>
      </section>


      <section className="sec warm">
        <div className="sec-head">
          <div className="label">Choose your plan</div>
          <h2>Simple Flat Pricing. No Catch.</h2>
          <p>Every plan includes clinician consultation, medication, and free shipping.</p>
        </div>
        <div className="pgrid">
          <div className="pcard">
            <span className="pbadge value">Best Value</span>
            <Link to="/qualify" style={{ display: "block" }}><img loading="lazy" decoding="async" src={semaVial} alt="Compounded Semaglutide vial" style={{ display: "block", margin: "0 auto 14px", height: 220, width: "auto", objectFit: "contain", cursor: "pointer" }} /></Link>
            <div className="pname">Semaglutide</div>
            <div className="ptype">Compounded GLP-1</div>
            <div className="prow"><span className="pnow">{semaText}</span><span className="pper">/mo</span></div>

            <ul className="pfeat">
              <li><span className="ck">✓</span> Doctor-prescribed compounded medication</li>
              <li><span className="ck">✓</span> All doses included</li>
              <li><span className="ck">✓</span> Free shipping</li>
              <li><span className="ck">✓</span> No membership fees</li>
            </ul>
            <div className="pdose">All doses included</div>
            <Link to="/qualify" className="btn btn-out" style={{ width: "100%" }}>Get started →</Link>
          </div>
          <div className="pcard hot">
            <span className="pbadge">Most Popular</span>
            <Link to="/qualify" style={{ display: "block" }}><img loading="lazy" decoding="async" src={tirzVial} alt="Compounded Tirzepatide vial" style={{ display: "block", margin: "0 auto 14px", height: 220, width: "auto", objectFit: "contain", cursor: "pointer" }} /></Link>
            <div className="pname">Tirzepatide</div>
            <div className="ptype">Compounded GLP-1 + GIP</div>
            <div className="prow"><span className="pnow">{tirzText}</span><span className="pper">/mo</span></div>

            <ul className="pfeat">
              <li><span className="ck">✓</span> Dual-action GLP-1 + GIP</li>
              <li><span className="ck">✓</span> All doses included</li>
              <li><span className="ck">✓</span> Free shipping</li>
              <li><span className="ck">✓</span> No membership fees</li>
            </ul>
            <div className="pdose">All doses included</div>
            <Link to="/qualify" className="btn btn-primary" style={{ width: "100%" }}>Lock In This Price →</Link>
          </div>
        </div>
      </section>

      <div className="tstrip">
        <div>🔒 HIPAA Compliant</div>
        <div>⚕️ U.S.-Licensed Clinicians</div>
        <div>🏥 State-Licensed Pharmacies</div>
        <div>❄️ Cold-Chain Shipping</div>
        <div>🛡️ No Insurance Needed</div>
      </div>

      <section className="sec">
        <div className="sec-head">
          <div className="label">Price comparison</div>
          <h2>Why People Switch to LegacyRX</h2>
          <p>Benchmarked against typical GLP-1 providers.</p>
        </div>
        <div className="ctable">
          <table>
            <thead><tr><th></th><th>Other Providers</th><th>LegacyRX</th></tr></thead>
            <tbody>
              <tr><td>Compounded Semaglutide</td><td className="cbad"><span className="cbig">$149-$499</span>/mo</td><td><span className="cbig">{semaText}</span>/mo</td></tr>
              <tr><td>Compounded Tirzepatide</td><td className="cbad"><span className="cbig">$299-$599</span>/mo</td><td><span className="cbig">{tirzText}</span>/mo</td></tr>
              <tr><td>Dose escalation fees</td><td>Prices rise at higher doses</td><td>$0 - same every dose</td></tr>
              <tr><td>Membership fees</td><td>$49-$129/mo extra</td><td>$0 - none</td></tr>
              <tr><td>Consultation</td><td>$50-$100</td><td>$0 - included</td></tr>
              <tr><td>Shipping</td><td>$9.99-$29.99</td><td>$0 - free</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="sec warm">
        <div className="sec-head">
          <div className="label">How it works</div>
          <h2>3 Steps. Under 5 Minutes.</h2>
          <p>100% online. No clinic visits.</p>
        </div>
        <div className="hgrid">
          <div className="hcard"><div className="hnum">1</div><h4>Quick Assessment</h4><p>Answer a short health questionnaire to see if you may qualify.</p></div>
          <div className="hcard"><div className="hnum">2</div><h4>Clinician Reviews</h4><p>A U.S.-licensed provider reviews your info and prescribes if appropriate.</p></div>
          <div className="hcard"><div className="hnum">3</div><h4>Delivered to You</h4><p>Medication ships from a state-licensed pharmacy with free shipping.</p></div>
        </div>
      </section>

      <section className="sec">
        <div className="sec-head">
          <div className="label">Patient stories</div>
          <h2>Real Patients. Real Results.</h2>
          <p>From people who started their journey with LegacyRX.</p>
        </div>
        <div className="rgrid">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rcard">
              <div className="stars">★★★★★</div>
              <div className="rtext">"{t.quote}"</div>
              <div className="rauthor">
                <div className="ravi">{t.initial}</div>
                <div>
                  <div className="rname">{t.name}</div>
                  <div className="rmeta">{t.meta}</div>
                </div>
              </div>
            </div>
          ))}

        </div>
        <p className="ph-note">Testimonials and any results shown must be from real patients and substantiated. Individual results vary; not everyone qualifies.</p>
      </section>

      <section className="sec warm">
        <div className="sec-head"><div className="label">FAQ</div><h2>Common Questions</h2></div>
        <div className="faq">
          <div className="item"><div className="q">Will my price ever increase?</div><div className="a">Your plan price is flat - the same at every dose. No surprise dose-escalation charges.</div></div>
          <div className="item"><div className="q">Is this real prescription medication?</div><div className="a">Yes - physician-prescribed compounded medication dispensed by state-licensed U.S. pharmacies. Compounded medications are not FDA-approved.</div></div>
          <div className="item"><div className="q">Any hidden fees?</div><div className="a">No. Your monthly price includes medication, clinician consultation, and free shipping.</div></div>
          <div className="item"><div className="q">Do I need insurance?</div><div className="a">No - flat self-pay pricing, no insurance required.</div></div>
          <div className="item"><div className="q">Is it safe?</div><div className="a">Treatment is overseen by U.S.-licensed clinicians. Tell your provider about your full medical history. Not everyone qualifies.</div></div>
        </div>
      </section>

      <section className="final">
        <h2>Lock In Today's Pricing</h2>
        <p>Check eligibility in 2 minutes. No commitment. Not everyone qualifies - a licensed clinician makes the final call.</p>
        <Link to="/qualify" className="btn btn-gold">Get started →</Link>
        <div className="fprices">
          <div className="fp"><div className="m">Semaglutide</div><div className="n">{semaText}</div><div className="m">/mo</div></div>
          <div className="fp"><div className="m">Tirzepatide</div><div className="n">{tirzText}</div><div className="m">/mo</div></div>
        </div>
      </section>

      <footer>
        <img loading="lazy" decoding="async" src={creamLogo} alt="LegacyRX" style={{ height: 40, width: "auto", display: "block", margin: "0 auto 14px", filter: "brightness(0) invert(1)" }} />
        <div className="disc">LegacyRX is a telehealth and pharmacy-fulfillment platform, not a medical practice. All prescribing decisions are made independently by a licensed clinician. Compounded medications are not FDA-approved; the FDA does not evaluate compounded medications for safety, effectiveness, or quality. Individual results vary. Not everyone qualifies. In an emergency call 9-1-1.</div>
        <div>
          <Link to="/privacy-policy" style={{ color: "rgba(239,230,218,.6)", textDecoration: "underline" }}>Privacy</Link>
          {" · "}
          <Link to="/hipaa-notice" style={{ color: "rgba(239,230,218,.6)", textDecoration: "underline" }}>HIPAA</Link>
          {" · "}
          <Link to="/important-safety-information" style={{ color: "rgba(239,230,218,.6)", textDecoration: "underline" }}>Safety Info</Link>
          {" · "}
          <Link to="/terms-of-use" style={{ color: "rgba(239,230,218,.6)", textDecoration: "underline" }}>Terms</Link>
        </div>
        <div style={{ marginTop: 12 }}>© 2026 LegacyRX LLC</div>
      </footer>

      <div className="smob">
        <Link to="/qualify" className="in" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
          <div className="pr">From <strong>{semaText}</strong>/mo</div>
          <span className="btn btn-primary" style={{ minHeight: 46, padding: "12px 20px" }}>Get started →</span>
        </Link>
      </div>

    </div>
  );
}
