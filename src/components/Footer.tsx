import { Link } from "@tanstack/react-router";
import { TrustBadges } from "./TrustBadges";
import creamLogo from "../assets/legacyrx-cream.webp";
import { OPEN_CONSENT_CHOICES_EVENT } from "@/lib/analytics-consent";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container-lx">
        <div className="foot-grid">
          <div>
            <img
              loading="lazy"
              decoding="async"
              src={creamLogo}
              alt="LegacyRX"
              style={{
                height: 40,
                width: "auto",
                display: "block",
                filter: "brightness(0) invert(1)",
              }}
            />
            <p
              style={{
                marginTop: 12,
                fontStyle: "italic",
                fontFamily: "var(--display)",
                color: "rgba(239,230,218,.7)",
              }}
            >
              Building a Healthier Legacy.
            </p>
            <div className="foot-badges">
              <TrustBadges variant="footer" />
            </div>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li>
                <Link to="/account">My account &amp; billing</Link>
              </li>
              <li>
                <Link to="/auth">Member portal</Link>
              </li>
              <li>
                <Link to="/how-it-works">How It Works</Link>
              </li>
              <li>
                <Link to="/medications">Medications</Link>
              </li>
              <li>
                <Link to="/mens-health">Testosterone (TRT)</Link>
              </li>
              <li>
                <Link to="/anti-aging">Anti-Aging</Link>
              </li>
              <li>
                <Link to="/sexual-health">Sexual Health</Link>
              </li>
              <li>
                <Link to="/faq">FAQ</Link>
              </li>
              <li>
                <Link to="/blog">Blog</Link>
              </li>
              <li>
                <Link to="/contact-us">Contact Us</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li>
                <Link to="/privacy-policy">Privacy Policy</Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_CHOICES_EVENT))}
                >
                  Cookie choices
                </button>
              </li>
              <li>
                <Link to="/hipaa-notice">HIPAA Notice</Link>
              </li>
              <li>
                <Link to="/ccpa-opt-out">Do Not Sell My Info</Link>
              </li>
              <li>
                <Link to="/terms-of-use">Terms of Use</Link>
              </li>
              <li>
                <Link to="/telehealth-consent">Telehealth Consent</Link>
              </li>
              <li>
                <Link to="/returns-refund-policy">Returns & Refunds</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li>
                <Link to="/important-safety-information">Important Safety Information</Link>
              </li>
              <li>
                <a href="mailto:support@legacyrx.net">support@legacyrx.net</a>
              </li>
              <li>
                <a href="tel:+18773618113">+1 877 361 8113</a>
              </li>
              <li>
                163 Church Rd
                <br />
                Stockton GA 31649
                <br />
                United States
              </li>
            </ul>
          </div>
        </div>
        <div className="foot-legal">
          <p>
            LegacyRX is a technology and pharmacy-fulfillment platform connecting U.S. adults 18+
            with independent licensed providers and U.S.-based, state-licensed compounding
            pharmacies. LegacyRX is not a medical practice or pharmacy and does not practice
            medicine or provide medical advice. All clinical decisions are made independently by
            licensed providers. Not everyone qualifies for a prescription.
          </p>
          <p>
            Compounded semaglutide (with B12) and compounded tirzepatide (with glycine) are{" "}
            <strong>not FDA-approved</strong> and are not the same as any brand-name product. The
            FDA does not evaluate compounded medications for safety, effectiveness, or quality. Read
            full <Link to="/important-safety-information">Important Safety Information</Link>.
          </p>
          <p>© 2026 LegacyRX LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
