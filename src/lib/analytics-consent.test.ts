import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  THIRD_PARTY_ANALYTICS_ENABLED,
  baseUserData,
  pushDataLayer,
  trackFunnelEvent,
  trackGa4,
  trackMeta,
  type MetaEventName,
} from "./analytics";
import {
  CONSENT_COOKIE,
  isTrackingExcludedPage,
  purgeLegacyTrackingState,
  saveAnalyticsChoice,
} from "./analytics-consent";

const values = new Map<string, string>();
const session = new Map<string, string>();
const requests = vi.fn();
const cookieWrites: string[] = [];
const browser = {
  localStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  },
  sessionStorage: {
    getItem: (key: string) => session.get(key) ?? null,
    setItem: vi.fn((key: string, value: string) => session.set(key, value)),
    removeItem: (key: string) => session.delete(key),
  },
  location: {
    pathname: "/",
    search: "?fbclid=synthetic-click-id&test_event_code=TEST123",
    href: "https://legacyrx.net/?fbclid=synthetic-click-id",
    hostname: "legacyrx.net",
    protocol: "https:",
  },
  dataLayer: undefined as unknown[] | undefined,
  dispatchEvent: vi.fn(),
};
const fakeDocument = {
  get cookie() {
    return "";
  },
  set cookie(value: string) {
    cookieWrites.push(value);
  },
  createElement: vi.fn(),
  head: { appendChild: vi.fn() },
};

const EVENTS: MetaEventName[] = [
  "PageView",
  "ViewContent",
  "CompleteRegistration",
  "AddToCart",
  "InitiateCheckout",
  "Purchase",
];

/** Everything a tracker could do: all entry points, with call-site data attached. */
function callEveryTracker() {
  for (const name of EVENTS) {
    trackFunnelEvent(name, { medication: "sema", medication_name: "Semaglutide", value: 199 });
    trackMeta(name, { medication: "sema", value: 199 });
  }
  trackGa4("generate_lead", { medication: "sema", email: "patient@example.test" });
  trackGa4("page_view");
  pushDataLayer({ event: "Purchase", order: "synthetic" });
}

function expectNothingEmitted() {
  expect(requests).not.toHaveBeenCalled();
  expect(browser.dataLayer).toBeUndefined();
  expect(cookieWrites).toEqual([]);
  expect(browser.sessionStorage.setItem).not.toHaveBeenCalled();
  expect(fakeDocument.createElement).not.toHaveBeenCalled();
  expect(fakeDocument.head.appendChild).not.toHaveBeenCalled();
}

beforeEach(() => {
  values.clear();
  session.clear();
  cookieWrites.length = 0;
  browser.dataLayer = undefined;
  browser.location.pathname = "/";
  browser.sessionStorage.setItem.mockClear();
  fakeDocument.createElement.mockReset();
  fakeDocument.head.appendChild.mockReset();
  requests.mockReset().mockResolvedValue({ ok: true });
  vi.stubGlobal("window", browser);
  vi.stubGlobal("location", browser.location);
  vi.stubGlobal("document", fakeDocument);
  vi.stubGlobal("navigator", { userAgent: "test-browser" });
  vi.stubGlobal("fetch", requests);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("GA4 and Meta are disabled", () => {
  it("has the hard switch off", () => {
    expect(THIRD_PARTY_ANALYTICS_ENABLED).toBe(false);
  });

  it("emits nothing with no consent and no configuration", () => {
    callEveryTracker();
    expectNothingEmitted();
  });

  it("emits nothing when GA4/Meta variables are set", () => {
    vi.stubEnv("VITE_GA4_MEASUREMENT_ID", "G-SYNTHETIC00");
    vi.stubEnv("VITE_META_PIXEL_ID", "000000000000000");
    vi.stubEnv("META_CAPI_TOKEN", "synthetic-token");
    vi.stubEnv("META_PIXEL_ID", "000000000000000");
    callEveryTracker();
    expectNothingEmitted();
  });

  it("emits nothing when the user previously accepted analytics", () => {
    saveAnalyticsChoice("accepted");
    cookieWrites.length = 0; // saving the old choice itself is not a tracker
    session.clear();
    browser.sessionStorage.setItem.mockClear();
    browser.dispatchEvent.mockClear();
    vi.stubEnv("VITE_GA4_MEASUREMENT_ID", "G-SYNTHETIC00");
    callEveryTracker();
    expectNothingEmitted();
  });

  it("emits nothing on any page, including excluded and public routes", () => {
    saveAnalyticsChoice("accepted");
    cookieWrites.length = 0;
    for (const path of [
      "/",
      "/weekend-sale",
      "/deal-of-the-day",
      "/lander-2",
      "/medications",
      "/qualify",
      "/start/sema",
      "/pay-test/sema",
      "/pay-test/result",
      "/contact-us",
      "/auth",
      "/account",
      "/admin",
      "/travis",
    ]) {
      browser.location.pathname = path;
      callEveryTracker();
    }
    expectNothingEmitted();
  });

  it("creates no Meta identifiers or cookies, even with fbclid in the URL", () => {
    expect(baseUserData()).toEqual({});
    callEveryTracker();
    expect(cookieWrites.filter((c) => /_fb[pc]=/.test(c))).toEqual([]);
    expect(session.size).toBe(0);
  });
});

describe("stale tracking state", () => {
  it("is removed, and nothing is created", () => {
    saveAnalyticsChoice("accepted");
    session.set("lrx_external_id", "synthetic");
    session.set("lrx_meta_test_event_code", "TEST123");
    cookieWrites.length = 0;
    purgeLegacyTrackingState();
    expect(values.size).toBe(0);
    expect(session.size).toBe(0);
    const cleared = cookieWrites.filter((c) => /Max-Age=0/.test(c));
    expect(cleared.some((c) => c.startsWith(`${CONSENT_COOKIE}=;`))).toBe(true);
    expect(cleared.some((c) => c.startsWith("_fbp=;"))).toBe(true);
    expect(cleared.some((c) => c.startsWith("_fbc=;"))).toBe(true);
    expect(cookieWrites.length).toBe(cleared.length);
  });
});

describe("tracking exclusion list (kept for the future setup)", () => {
  it("still marks intake, checkout, support and private pages", () => {
    for (const path of [
      "/qualify",
      "/start/sema",
      "/pay-test/sema",
      "/pay-test/result",
      "/contact-us",
      "/auth",
      "/account",
      "/admin",
      "/travis",
    ]) {
      expect(isTrackingExcludedPage(path)).toBe(true);
    }
    expect(isTrackingExcludedPage("/")).toBe(false);
  });
});
