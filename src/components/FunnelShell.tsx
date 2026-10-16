import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Wordmark } from "./Brand";
import { OrderHelp } from "./OrderHelp";
import { useFromPrices } from "@/hooks/use-live-prices";
import { resolveCampaignCoupon } from "@/lib/coupon";

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
  const { sema, semaText } = useFromPrices();
  // A campaign visitor should see the discounted from-price in the banner too.
  const [promoPct, setPromoPct] = useState(0);
  useEffect(() => {
    // Only a promo in the current link counts - nothing is applied by default.
    const fromUrl = new URLSearchParams(window.location.search).get("promo");
    const c = resolveCampaignCoupon(fromUrl);
    if (c?.valid && c.type === "percent") setPromoPct(Number(c.value ?? 0));
  }, []);
  const fromText =
    promoPct > 0 && sema > 0
      ? `$${(sema * (1 - promoPct / 100)).toFixed(2)}`
      : semaText;
  return (
    <div className="funnel">
      <div className="funnel-logo">
        <Link to="/" aria-label="LegacyRX home" style={{ textDecoration: "none", color: "inherit" }}>
          <Wordmark />
        </Link>
      </div>
      <div className="offer-banner">
        <span className="pill">FLAT PRICING</span>
        From {fromText}/mo · Free shipping
      </div>

      <div className="funnel-progress">
        <div style={{ width: `${pct}%` }} />
      </div>
      <div className={`funnel-card ${wide ? "wide" : ""}`}>{children}</div>
      <OrderHelp />
      {!hideTrust && (
        <div className="trust-icons">
          <div><span className="ti">🛡</span>HIPAA Compliant</div>
          <div><span className="ti">$</span>No Hidden Fees</div>
          <div><span className="ti">★</span>Made in the USA</div>
        </div>
      )}
      <div className="mini-footer">
        © 2026 LegacyRX LLC. All rights reserved.
        <div className="mini-links">
          <Link to="/privacy-policy">Privacy Policy</Link> ·{" "}
          <Link to="/hipaa-notice">HIPAA</Link> ·{" "}
          <Link to="/returns-refund-policy">Returns & Refunds</Link>
        </div>
      </div>
    </div>
  );
}
