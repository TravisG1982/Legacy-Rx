import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Wordmark } from "./Brand";
import { OrderHelp } from "./OrderHelp";
import { useFromPrices } from "@/hooks/use-live-prices";
import { OPEN_CONSENT_CHOICES_EVENT } from "@/lib/analytics-consent";

export function FunnelShell({
  pct,
  wide,
  hideTrust,
  children,
}: {
  pct: number;
  wide?: boolean;
  hideTrust?: boolean;
  children: ReactNode;
}) {
  const { semaText } = useFromPrices();
  return (
    <div className="funnel">
      <div className="funnel-logo">
        <Link
          to="/"
          aria-label="LegacyRX home"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Wordmark />
        </Link>
      </div>
      <div className="offer-banner">
        <span className="pill">FLAT PRICING</span>
        From {semaText}/mo · Free shipping
      </div>

      <div className="funnel-progress">
        <div style={{ width: `${pct}%` }} />
      </div>
      <div className={`funnel-card ${wide ? "wide" : ""}`}>{children}</div>
      <OrderHelp />
      {!hideTrust && (
        <div className="trust-icons">
          <div>
            <span className="ti">🛡</span>HIPAA Compliant
          </div>
          <div>
            <span className="ti">$</span>No Hidden Fees
          </div>
          <div>
            <span className="ti">★</span>Made in the USA
          </div>
        </div>
      )}
      <div className="mini-footer">
        © 2026 LegacyRX LLC. All rights reserved.
        <div className="mini-links">
          <Link to="/privacy-policy">Privacy Policy</Link> · <Link to="/hipaa-notice">HIPAA</Link> ·{" "}
          <Link to="/returns-refund-policy">Returns & Refunds</Link> ·{" "}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_CHOICES_EVENT))}
          >
            Cookie choices
          </button>
        </div>
      </div>
    </div>
  );
}
