/**
 * The single module that talks to Meta.
 *
 * Design rule for this vertical (health & wellness / telehealth): no product,
 * medication, plan or personal identity value is EVER sent to Meta. Only
 * anonymized identifiers plus a monetary value. See meta-payload.test.ts.
 *
 * Only generic event names may leave the app after an explicit opt-in.
 */

import { metaSafeUrl } from "./meta-safe-title";
import { hasAnalyticsConsent, isTrackingExcludedPage } from "./analytics-consent";

const CAPI_ENDPOINT = "/api/public/meta-capi";

const EXTERNAL_ID_KEY = "lrx_external_id";
const TEST_EVENT_CODE_KEY = "lrx_meta_test_event_code";

export type MetaEventName =
  | "PageView"
  | "ViewContent"
  | "CompleteRegistration"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase";

export type MetaUserData = {
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
  external_id?: string;
};

export type MetaEventPayload = {
  event_name: MetaEventName;
  event_id: string;
  event_time?: number;
  event_source_url: string;
  action_source: "website";
  user_data: MetaUserData;
  test_event_code?: string;
};

/* ------------------------------------------------------------------ cookies */

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match?.[1] ?? "";
}

/**
 * The raw `fbclid` exactly as Meta wrote it into the URL. Deliberately read with
 * a regex rather than URLSearchParams: that decoder rewrites characters (a `+`
 * becomes a space), and Meta rejects any `fbc` whose click id differs by even
 * one byte from the one it issued.
 */
function rawFbclid(): string {
  if (typeof window === "undefined") return "";
  const match = window.location.search.match(/[?&]fbclid=([^&#]*)/);
  return match?.[1] ?? "";
}

/**
 * _fbc is the strongest paid-attribution signal, but the cookie is sometimes
 * not written before the visitor navigates away from the landing URL. Rebuild
 * it from fbclid in Meta's required format - byte-for-byte, never lowercased or
 * truncated. The Pixel's own cookie always wins when present, since it carries
 * the true click timestamp.
 */
export function ensureFbcCookie(): string {
  if (typeof window === "undefined") return "";
  const existing = getCookie("_fbc");
  if (existing) return existing;

  const fbclid = rawFbclid();
  if (!fbclid) return "";

  const value = `fb.1.${Date.now()}.${fbclid}`;
  const host = window.location.hostname.replace(/^www\./, "");
  document.cookie =
    `_fbc=${value}; path=/; max-age=7776000` +
    (host.includes(".") ? `; domain=.${host}` : "") +
    "; SameSite=Lax";
  return value;
}

/**
 * `fbp` is the primary deduplication key Meta compares between a browser Pixel
 * hit and its Conversions API twin. fbevents.js writes `_fbp` asynchronously,
 * so a PageView fired on mount can go out server-side without it - the pair
 * then reads as poorly matched and drags the "CAPI coverage" rate down.
 * Writing a first-party `_fbp` ourselves (Meta's `fb.1.{ts}.{random}` format)
 * before fbevents loads makes the Pixel adopt the exact same value.
 */
export function ensureFbpCookie(): string {
  if (typeof window === "undefined") return "";
  const existing = getCookie("_fbp");
  if (existing) return existing;

  const random = `${Math.floor(Math.random() * 1e10)}${Math.floor(Math.random() * 1e8)}`;
  const value = `fb.1.${Date.now()}.${random}`;
  const host = window.location.hostname.replace(/^www\./, "");
  document.cookie =
    `_fbp=${value}; path=/; max-age=7776000` +
    (host.includes(".") ? `; domain=.${host}` : "") +
    "; SameSite=Lax";
  return value;
}

/* -------------------------------------------------- session identity + test */

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * A random per-session funnel id. Hashed server-side and sent on every event so
 * Meta can stitch PageView -> CompleteRegistration -> Purchase to one person
 * while receiving no email, phone or name at all.
 */
export function getExternalId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.sessionStorage.getItem(EXTERNAL_ID_KEY);
    if (existing) return existing;
    const id = randomId();
    window.sessionStorage.setItem(EXTERNAL_ID_KEY, id);
    return id;
  } catch {
    return "";
  }
}

/**
 * Test event code from Events Manager. Captured from the URL on first load and
 * persisted, so it survives SPA navigation after the query string disappears.
 */
export function getTestEventCode(): string {
  if (typeof window === "undefined") return "";
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("test_event_code");
    if (fromUrl) {
      window.sessionStorage.setItem(TEST_EVENT_CODE_KEY, fromUrl);
      return fromUrl;
    }
    return window.sessionStorage.getItem(TEST_EVENT_CODE_KEY) ?? "";
  } catch {
    return "";
  }
}

/* ------------------------------------------------------------ payload build */

/** user_data shared by every event: no health signal, no direct identity. */
export function baseUserData(): MetaUserData {
  if (typeof window === "undefined") return {};
  const externalId = getExternalId();
  const fbp = ensureFbpCookie();
  const fbc = ensureFbcCookie();
  return {
    client_user_agent: navigator.userAgent,
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
    ...(externalId ? { external_id: externalId } : {}),
  };
}

/** Pure, testable payload builder. Nothing else may construct a Meta payload. */
export function buildMetaPayload(
  eventName: MetaEventName,
  eventId: string,
  opts: {
    userData?: MetaUserData;
    sourceUrl?: string;
    testEventCode?: string;
    /** Unix seconds captured in the browser, so Meta measures real freshness. */
    eventTime?: number;
  } = {},
): MetaEventPayload {
  const payload: MetaEventPayload = {
    event_name: eventName,
    event_id: eventId,
    event_source_url: metaSafeUrl(opts.sourceUrl),
    action_source: "website",
    user_data: opts.userData ?? baseUserData(),
  };
  if (typeof opts.eventTime === "number" && Number.isFinite(opts.eventTime)) {
    payload.event_time = Math.floor(opts.eventTime);
  }
  const testCode = opts.testEventCode ?? (typeof window !== "undefined" ? getTestEventCode() : "");
  if (testCode) payload.test_event_code = testCode;
  return payload;
}

export function newEventId(): string {
  return randomId();
}

/* ---------------------------------------------------------------- transports */

/** Server-side Conversions API hit. Fire and forget. */
async function trackCapi(payload: MetaEventPayload) {
  if (typeof window === "undefined") return;
  try {
    await fetch(CAPI_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Never let tracking break the funnel.
  }
}

/* ------------------------------------------------------------------ GA4 side */

/** GA4 property for legacyrx.net. Overridable via env for other environments. */
const GA4_MEASUREMENT_ID =
  (import.meta.env["VITE_GA4_MEASUREMENT_ID"] as string | undefined) ?? "G-9S90Q8BPDW";

function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(args);
}

/** Only the event name is queued. No answers, product, order, URL or title. */
export function trackGa4(eventName: string, _detail: Record<string, unknown> = {}) {
  if (!GA4_MEASUREMENT_ID || !hasAnalyticsConsent() || isTrackingExcludedPage(location.pathname))
    return;
  gtag("event", eventName);
}

/* -------------------------------------------------------- public trackers */

export type FunnelDetail = {
  /** Accepted for existing call sites, but discarded by the analytics boundary. */
  medication?: string;
  medication_name?: string;
  plan_id?: string;
  plan_label?: string;
  /** Real price. Sent to Meta as custom_data.value on monetary events only. */
  value?: number;
};

/**
 * Browser Pixel is paused until its external configuration can be reviewed.
 */
export function isBrowserPixelEvent(eventName: MetaEventName): boolean {
  void eventName;
  return false;
}

/**
 * Send a generic event through our server relay only after analytics consent.
 * Call-site details are deliberately ignored.
 */
export function trackMeta(eventName: MetaEventName, detail: FunnelDetail = {}) {
  if (
    typeof window === "undefined" ||
    !hasAnalyticsConsent() ||
    isTrackingExcludedPage(location.pathname)
  )
    return;
  const eventId = newEventId();
  void detail;
  const sourceUrl = metaSafeUrl();
  void trackCapi(
    buildMetaPayload(eventName, eventId, {
      sourceUrl,
      eventTime: Math.floor(Date.now() / 1000),
    }),
  );
}

/** Queue only generic event names; no external GTM script is loaded at present. */
export function pushDataLayer(payload: Record<string, unknown>) {
  if (
    typeof window === "undefined" ||
    !hasAnalyticsConsent() ||
    isTrackingExcludedPage(location.pathname)
  )
    return;
  if (typeof payload.event !== "string") return;
  const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event: payload.event });
}

/** Meta event name -> GA4 recommended event name. */
const META_TO_GA4: Record<MetaEventName, string> = {
  PageView: "page_view",
  ViewContent: "view_item",
  CompleteRegistration: "generate_lead",
  AddToCart: "add_to_cart",
  InitiateCheckout: "begin_checkout",
  Purchase: "purchase",
};

/**
 * Keep generic event names only. Third-party browser tags are paused.
 */
export function trackFunnelEvent(
  eventName: MetaEventName,
  detail: FunnelDetail & Record<string, unknown> = {},
) {
  void detail;
  pushDataLayer({ event: eventName });
  trackGa4(META_TO_GA4[eventName]);
  trackMeta(eventName);
}
