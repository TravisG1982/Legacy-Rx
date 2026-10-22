import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  analyticsChoice,
  saveAnalyticsChoice,
  OPEN_CONSENT_CHOICES_EVENT,
  type AnalyticsChoice,
} from "@/lib/analytics-consent";

export function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!analyticsChoice()) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_CHOICES_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_CHOICES_EVENT, reopen);
  }, []);

  function save(value: AnalyticsChoice) {
    saveAnalyticsChoice(value);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <div className="cookie-consent-inner">
        <div className="cookie-consent-text">
          <strong>We value your privacy</strong>
          <p>
            Optional analytics help us understand site use. Your choice does not affect ordering,
            and you can change it later. Read our <Link to="/privacy-policy">Privacy Policy</Link>{" "}
            for more details.
          </p>
        </div>
        <div className="cookie-consent-actions">
          <button type="button" className="btn btn-ghost" onClick={() => save("declined")}>
            Decline
          </button>
          <button type="button" className="btn btn-primary" onClick={() => save("accepted")}>
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}
