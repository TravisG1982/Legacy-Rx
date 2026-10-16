import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const KEY = "legacyrx-cookie-consent";

export function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {}
  }, []);

  function save(value: "accepted" | "declined") {
    try { localStorage.setItem(KEY, value); } catch {}
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <div className="cookie-consent-inner">
        <div className="cookie-consent-text">
          <strong>We value your privacy</strong>
          <p>
            We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
            By clicking "Accept All", you consent to our use of cookies. Read our{" "}
            <Link to="/privacy-policy">Privacy Policy</Link> for more details.
          </p>
        </div>
        <div className="cookie-consent-actions">
          <button type="button" className="btn btn-ghost" onClick={() => save("declined")}>
            Decline
          </button>
          <button type="button" className="btn btn-primary" onClick={() => save("accepted")}>
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
