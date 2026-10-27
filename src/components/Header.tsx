import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className="site-header">
      <div className="container-lx nav">
        <Link className="nav-logo" to="/" aria-label="LegacyRX home">
          <LogoMark />
        </Link>
        <div className="nav-cta">
          <Link className="btn btn-primary" to="/qualify">
            Get started →
          </Link>
        </div>
        <button
          type="button"
          className="burger"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "×" : "☰"}
        </button>
        <nav
          id="primary-navigation"
          aria-label="Primary navigation"
          className={`nav-links ${open ? "open" : ""}`}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
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
      </div>
    </header>
  );
}
