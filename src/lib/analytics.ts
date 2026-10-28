/**
 * Third-party analytics boundary (GA4 and Meta): everything here is INACTIVE.
 *
 * Client decision: Google Analytics 4 and Meta (Pixel / Conversions API) stay
 * completely off until a separately approved, healthcare-privacy-safe setup is
 * built. This is a hard gate, not a preference: nothing below reads a consent
 * choice, an environment variable or a measurement ID, and nothing creates a
 * request, a dataLayer entry, an identifier or a marketing cookie.
 *
 * The exported tracker functions keep their signatures only so existing pages
 * and the qualification flow keep compiling. They are intentional no-ops.
 * Re-enabling them is a separate, quoted piece of work and must not start from
 * flipping a flag here.
 *
 * The pure payload builder remains for its data-minimization tests: it never
 * touches the network and, while disabled, writes no cookie or storage value.
 */

import { metaSafeUrl } from "./meta-safe-title";

/** Single explicit switch. Not configurable from the environment or by consent. */
export const THIRD_PARTY_ANALYTICS_ENABLED = false as const;

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

/* ------------------------------------------------------------ payload build */

/**
 * user_data for every event. Empty while analytics is disabled: no `_fbp`/`_fbc`
 * cookie, session identifier or test code is generated or stored.
 */
export function baseUserData(): MetaUserData {
  return {};
}

/** Pure, testable payload builder. It never sends anything. */
export function buildMetaPayload(
  eventName: MetaEventName,
  eventId: string,
  opts: {
    userData?: MetaUserData;
    sourceUrl?: string;
    testEventCode?: string;
    /** Unix seconds captured in the browser. */
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
  if (opts.testEventCode) payload.test_event_code = opts.testEventCode;
  return payload;
}

/* -------------------------------------------------------- public trackers */

export type FunnelDetail = {
  /** Accepted for existing call sites, but discarded by the analytics boundary. */
  medication?: string;
  medication_name?: string;
  plan_id?: string;
  plan_label?: string;
  value?: number;
};

/** Browser Pixel is not loaded and no event may be routed to it. */
export function isBrowserPixelEvent(eventName: MetaEventName): boolean {
  void eventName;
  return false;
}

/** GA4: disabled no-op. Never touches `dataLayer` or the network. */
export function trackGa4(eventName: string, _detail: Record<string, unknown> = {}) {
  void eventName;
  void _detail;
}

/** Meta (Pixel and server relay): disabled no-op. Never sends a request. */
export function trackMeta(eventName: MetaEventName, detail: FunnelDetail = {}) {
  void eventName;
  void detail;
}

/** Tag-manager queue: disabled no-op. Never creates or writes `dataLayer`. */
export function pushDataLayer(payload: Record<string, unknown>) {
  void payload;
}

/** Funnel milestone hook kept for existing call sites: disabled no-op. */
export function trackFunnelEvent(
  eventName: MetaEventName,
  detail: FunnelDetail & Record<string, unknown> = {},
) {
  void eventName;
  void detail;
}
