// GA4 and Meta are disabled outright (see analytics.ts): nothing reads this choice
// to enable them and no UI offers it. The helpers remain only for the future,
// separately approved setup.
export type AnalyticsChoice = "accepted" | "declined";

// Versioned so prior "accept" records (when scripts loaded before consent)
// do not silently opt users into this different tracking setup.
const STORAGE_KEY = "legacyrx-cookie-consent-v2";
export const CONSENT_COOKIE = "lrx_analytics_consent";
export const CONSENT_CHANGED_EVENT = "legacyrx:analytics-consent-changed";

export function analyticsChoice(): AnalyticsChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const choice = window.localStorage.getItem(STORAGE_KEY);
    return choice === "accepted" || choice === "declined" ? choice : null;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return analyticsChoice() === "accepted";
}

export function saveAnalyticsChoice(choice: AnalyticsChoice): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
    document.cookie = `${CONSENT_COOKIE}=${choice}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    if (choice === "declined") {
      document.cookie = "_fbp=; Path=/; Max-Age=0; SameSite=Lax";
      document.cookie = "_fbc=; Path=/; Max-Age=0; SameSite=Lax";
      window.sessionStorage.removeItem("lrx_external_id");
      window.sessionStorage.removeItem("lrx_meta_test_event_code");
    }
  } catch {
    // If consent cannot be persisted, subsequent tracking remains off.
  }
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
}

export function isProtectedPage(pathname: string): boolean {
  return (
    pathname === "/auth" ||
    pathname === "/account" ||
    pathname === "/admin" ||
    pathname === "/travis" ||
    pathname.startsWith("/account/") ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/travis/")
  );
}

/** No third-party analytics in intake, checkout, support, or private areas. */
export function isTrackingExcludedPage(pathname: string): boolean {
  return (
    isProtectedPage(pathname) ||
    ["/qualify", "/contact-us", "/thank-you", "/not-eligible"].includes(pathname) ||
    pathname.startsWith("/start/") ||
    pathname.startsWith("/pay-test/")
  );
}

/**
 * Remove marketing-tracking leftovers from earlier builds: a stored analytics
 * choice, our consent cookie, Meta `_fbp`/`_fbc` cookies and the session-scoped
 * Meta identifiers. Only deletes; never creates anything.
 */
export function purgeLegacyTrackingState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem("lrx_external_id");
    window.sessionStorage.removeItem("lrx_meta_test_event_code");
  } catch {
    // Storage may be unavailable; nothing to clean in that case.
  }
  try {
    const host = window.location.hostname.replace(/^www\./, "");
    const domains = ["", ...(host.includes(".") ? [`; Domain=.${host}`, `; Domain=${host}`] : [])];
    for (const name of [CONSENT_COOKIE, "_fbp", "_fbc"]) {
      for (const domain of domains) {
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${domain}`;
      }
    }
  } catch {
    // Cookies may be unavailable.
  }
}
