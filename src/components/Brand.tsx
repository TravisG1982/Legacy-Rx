import { Link } from "@tanstack/react-router";
import logo from "../assets/legacyrx-burgundy.webp";

export function Wordmark({ cream = false }: { cream?: boolean }) {
  return (
    <span className="wordmark" style={cream ? { color: "var(--cream)" } : undefined}>
      Legacy<span className="rx">Rx</span>
    </span>
  );
}

export function LogoMark({ alt = "LegacyRX" }: { alt?: string }) {
  return <img loading="lazy" decoding="async" src={logo} alt={alt} style={{ height: 36, width: "auto", display: "block" }} />;
}

export function CtaBand() {
  return (
    <section className="lx" style={{ paddingTop: 0 }}>
      <div className="container-lx">
        <div className="ctaband">
          <h2>Start your assessment today</h2>
          <p style={{ maxWidth: 520, margin: "0 auto 22px" }}>
            A U.S.-licensed clinician reviews your information usually within 1 day.
          </p>
          <Link className="btn btn-cream btn-lg" to="/qualify">
            Get started →
          </Link>
        </div>
      </div>
    </section>
  );
}
