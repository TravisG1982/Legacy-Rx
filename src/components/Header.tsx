import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { LogoMark } from "./Brand";

export function TrustBar() {
  return (
    <div className="trustbar">
      🔒 HIPAA Compliant · Free Shipping · Cancel Anytime · <strong>147,800+ patients treated · 4.8★ average rating</strong>
    </div>
  );
}


export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container-lx nav">
        <Link to="/" aria-label="LegacyRX home" style={{ display: "flex", alignItems: "center" }}>
          <LogoMark />
        </Link>
        <nav className={`nav-links ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
          <Link to="/">Home</Link>
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/medications">Weight Loss</Link>
          <Link to="/mens-health">TRT</Link>
          <Link to="/anti-aging">Anti-Aging</Link>
          <Link to="/sexual-health">ED</Link>
          <Link to="/" hash="pricing">Pricing</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/contact-us">Contact</Link>
          <Link to="/auth">Login</Link>
        </nav>
        <div className="nav-cta">
          <Link className="btn btn-primary" to="/qualify">
            Get started →
          </Link>
        </div>
        <button
          type="button"
          className="burger"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </div>
    </header>
  );
}
