/**
 * The single module that talks to Meta.
 *
 * Design rule for this vertical (health & wellness / telehealth): no product,
 * medication, plan or personal identity value is EVER sent to Meta. Only
 * anonymized identifiers plus a monetary value. See meta-payload.test.ts.
 *
 * Full internal detail (medication, plan, price) goes to GA4 instead.
 */

import { metaSafeUrl, withMetaSafeTitle } from "./meta-safe-title";

export const META_PIXEL_ID = "1260936169249076";
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

export type MetaCustomData = { currency: "USD"; value: number };

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
  custom_data?: MetaCustomData;
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
    value?: number;
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
    event_source_url: opts.sourceUrl ?? metaSafeUrl(),
    action_source: "website",
    user_data: opts.userData ?? baseUserData(),
  };
  if (typeof opts.eventTime === "number" && Number.isFinite(opts.eventTime)) {
    payload.event_time = Math.floor(opts.eventTime);
  }
  if (typeof opts.value === "number" && Number.isFinite(opts.value)) {
    payload.custom_data = { currency: "USD", value: opts.value };
  }
  const testCode =
    opts.testEventCode ?? (typeof window !== "undefined" ? getTestEventCode() : "");
  if (testCode) payload.test_event_code = testCode;
  return payload;
}

export function newEventId(): string {
  return randomId();
}

/* ---------------------------------------------------------------- transports */

function fbq(): ((...args: unknown[]) => void) | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
}

/** Browser Pixel hit, with the title/URL neutralized while it serializes. */
function trackPixel(eventName: MetaEventName, eventId: string, value?: number) {
  const f = fbq();
  if (!f) return;
  const custom = typeof value === "number" ? { currency: "USD", value } : {};
  withMetaSafeTitle(() => f("track", eventName, custom, { eventID: eventId }));
}

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
  (import.meta.env["VITE_GA4_MEASUREMENT_ID"] as string | undefined) ??
  (import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY"] as
    | string
    | undefined) ??
  "G-9S90Q8BPDW";

let ga4Loaded = false;

function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(args);
}

/** Loads gtag.js once, only when a measurement id is configured. */
export function initGa4() {
  if (typeof window === "undefined" || ga4Loaded || !GA4_MEASUREMENT_ID) return;
  ga4Loaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(s);
  gtag("js", new Date());
  gtag("config", GA4_MEASUREMENT_ID, { send_page_view: false });
}

/** GA4 keeps the FULL picture - medication, plan, price, page path. */
export function trackGa4(eventName: string, detail: Record<string, unknown> = {}) {
  if (!GA4_MEASUREMENT_ID) return;
  gtag("event", eventName, detail);
}

/* -------------------------------------------------------- public trackers */

export type FunnelDetail = {
  /** Internal-only detail. Goes to GA4 and GTM, never to Meta. */
  medication?: string;
  medication_name?: string;
  plan_id?: string;
  plan_label?: string;
  /** Real price. Sent to Meta as custom_data.value on monetary events only. */
  value?: number;
};

/**
 * Events that are still allowed to leave the browser through the Pixel.
 * The four conversion events are Conversions API only, by product decision.
 */
const BROWSER_PIXEL_EVENTS = new Set<MetaEventName>(["PageView", "ViewContent"]);

export function isBrowserPixelEvent(eventName: MetaEventName): boolean {
  return BROWSER_PIXEL_EVENTS.has(eventName);
}

/**
 * Fire one Meta event. PageView and ViewContent go through both transports with
 * a shared event_id, event_source_url and value so Meta dedupes the pair.
 * CompleteRegistration, AddToCart, InitiateCheckout and Purchase are sent
 * server-side ONLY - no Pixel copy leaves the browser for them.
 * No personal detail is ever attached - see buildMetaPayload.
 */
export function trackMeta(eventName: MetaEventName, detail: FunnelDetail = {}) {
  if (typeof window === "undefined") return;
  const eventId = newEventId();
  const monetary =
    eventName === "AddToCart" ||
    eventName === "InitiateCheckout" ||
    eventName === "Purchase";
  const value = monetary ? detail.value : undefined;
  const sourceUrl = metaSafeUrl();

  if (isBrowserPixelEvent(eventName)) {
    trackPixel(eventName, eventId, value);
  }
  void trackCapi(
    buildMetaPayload(eventName, eventId, {
      value,
      sourceUrl,
      eventTime: Math.floor(Date.now() / 1000),
    }),
  );
}


/** Push to the existing GTM dataLayer (full internal detail, unchanged). */
export function pushDataLayer(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(payload);
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

const GA4_MONETARY = new Set<MetaEventName>([
  "AddToCart",
  "InitiateCheckout",
  "Purchase",
]);

function buildGa4Params(
  eventName: MetaEventName,
  detail: FunnelDetail & Record<string, unknown>,
): Record<string, unknown> {
  const params: Record<string, unknown> = { ...detail };
  if (GA4_MONETARY.has(eventName)) {
    params["value"] = typeof detail.value === "number" ? detail.value : 0;
    params["currency"] = (detail["currency"] as string | undefined) ?? "USD";
    if (eventName === "Purchase" && !params["transaction_id"]) {
      params["transaction_id"] = newEventId();
    }
  } else {
    delete params["value"];
    delete params["currency"];
  }
  return params;
}

/**
 * One call per funnel event: GTM + GA4 get the full detail (GA4 under its own
 * recommended event names), Meta gets the minimized payload built from
 * `detail.value` only.
 */
export function trackFunnelEvent(
  eventName: MetaEventName,
  detail: FunnelDetail & Record<string, unknown> = {},
) {
  pushDataLayer({ event: eventName, ...detail });
  trackGa4(META_TO_GA4[eventName], buildGa4Params(eventName, detail));
  trackMeta(eventName, detail);
}

// Run at load - by the time a conversion fires, the fbclid is long gone, and
// both transports must already agree on the fbp/external_id dedup keys.
if (typeof window !== "undefined") {
  ensureFbpCookie();
  ensureFbcCookie();
  getExternalId();
  getTestEventCode();
}
