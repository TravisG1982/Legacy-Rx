/**
 * Health-category data minimization helpers. Browser Pixel is currently paused.
 *
 * Every fbq() hit automatically carries document.title (dt), the full URL (dl)
 * and the referrer (rl). Our SEO titles legitimately contain category terms
 * ("GLP-1", "Semaglutide", "Medical Weight Loss"), and those must never reach
 * Meta. This module neutralizes all three.
 */

export const HEALTH_CATEGORY_PATTERN =
  /glp\s*-?\s*1|semaglutide|tirzepatide|weight\s*-?\s*loss|weight\s*loss|compounded|telehealth|obesity|ozempic|wegovy|mounjaro|zepbound|medication|prescri(?:be|ption)|injection|dose|clinician|physician|doctor/i;

const BRAND = "LegacyRX";

/** One neutral title per public route, retained for any future Pixel review. */
const ROUTE_TO_NEUTRAL_TITLE: Record<string, string> = {
  "/": BRAND,
  "/faq": `${BRAND} - FAQ`,
  "/how-it-works": `${BRAND} - How It Works`,
  "/medications": `${BRAND} - Programs`,
  "/contact-us": `${BRAND} - Contact`,
  "/qualify": `${BRAND} - Get Started`,
  "/checkout": `${BRAND} - Checkout`,
  "/not-eligible": `${BRAND} - Thanks`,
  "/lander": BRAND,
  "/lander-1": BRAND,
  "/privacy-policy": `${BRAND} - Privacy Policy`,
  "/terms-of-use": `${BRAND} - Terms of Use`,
  "/telehealth-consent": `${BRAND} - Consent`,
  "/hipaa-notice": `${BRAND} - Notice`,
  "/ccpa-opt-out": `${BRAND} - Privacy Choices`,
  "/returns-refund-policy": `${BRAND} - Returns Policy`,
  "/important-safety-information": `${BRAND} - Safety Information`,
  "/blog": `${BRAND} - Journal`,
};

/** Neutral title for the current (or given) path. */
export function metaSafeTitle(pathname?: string): string {
  if (typeof window === "undefined") return BRAND;
  const path = pathname ?? window.location.pathname;
  if (path.startsWith("/blog/")) return `${BRAND} - Journal`;
  return ROUTE_TO_NEUTRAL_TITLE[path] ?? BRAND;
}

/** Neutral site origin only: no path, query string or hash. */
export function metaSafeUrl(href?: string): string {
  if (!href && typeof window === "undefined") return "";
  try {
    const url = new URL(href ?? window.location.href);
    return `${url.origin}/`;
  } catch {
    return "";
  }
}

/**
 * Swap in a neutral title only for the instant the Pixel hit is serialized,
 * then restore the real title. SEO and users keep the real value.
 */
export function withMetaSafeTitle<T>(dispatch: () => T): T {
  if (typeof document === "undefined") return dispatch();

  const realTitle = document.title;
  if (!HEALTH_CATEGORY_PATTERN.test(realTitle)) return dispatch();

  const neutral = metaSafeTitle();
  document.title = neutral;
  try {
    return dispatch();
  } finally {
    setTimeout(() => {
      // Only restore if nothing else (a route change) changed it meanwhile.
      if (document.title === neutral) document.title = realTitle;
    }, 400);
  }
}
