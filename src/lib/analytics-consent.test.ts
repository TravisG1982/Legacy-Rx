import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackFunnelEvent } from "./analytics";
import { analyticsChoice, isTrackingExcludedPage, saveAnalyticsChoice } from "./analytics-consent";

const values = new Map<string, string>();
const session = new Map<string, string>();
const requests = vi.fn();
const browser = {
  localStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  },
  sessionStorage: {
    getItem: (key: string) => session.get(key) ?? null,
    setItem: (key: string, value: string) => session.set(key, value),
    removeItem: (key: string) => session.delete(key),
  },
  location: {
    pathname: "/qualify",
    search: "",
    href: "https://legacyrx.net/qualify?step=2",
    hostname: "legacyrx.net",
    protocol: "https:",
  },
  dataLayer: [] as unknown[],
  dispatchEvent: vi.fn(),
};

beforeEach(() => {
  values.clear();
  session.clear();
  browser.dataLayer = [];
  browser.location.pathname = "/qualify";
  requests.mockReset().mockResolvedValue({ ok: true });
  vi.stubGlobal("window", browser);
  vi.stubGlobal("location", browser.location);
  vi.stubGlobal("document", { cookie: "" });
  vi.stubGlobal("navigator", { userAgent: "test-browser" });
  vi.stubGlobal("fetch", requests);
});

afterEach(() => vi.unstubAllGlobals());

describe("analytics consent boundary", () => {
  it("sends nothing before consent or after Decline", () => {
    trackFunnelEvent("CompleteRegistration", { medication: "sema", on_glp1: "yes" });
    expect(requests).not.toHaveBeenCalled();
    expect(browser.dataLayer).toEqual([]);
    saveAnalyticsChoice("declined");
    expect(analyticsChoice()).toBe("declined");
    trackFunnelEvent("AddToCart", { medication_name: "Semaglutide" });
    expect(requests).not.toHaveBeenCalled();
    expect(browser.dataLayer).toEqual([]);
  });

  it("discards medical answers, product details and URLs after consent", () => {
    saveAnalyticsChoice("accepted");
    browser.location.pathname = "/";
    trackFunnelEvent("CompleteRegistration", {
      medication: "sema",
      medication_name: "Semaglutide",
      on_glp1: "yes",
      page_location: "https://legacyrx.net/qualify?patient=test@example.com",
    });
    expect(requests).toHaveBeenCalledOnce();
    const [, init] = requests.mock.calls[0] as [string, RequestInit];
    const body = String(init.body);
    expect(body).not.toMatch(/sema|glp1|example.com|qualify/i);
    expect(JSON.parse(body).event_source_url).toBe("https://legacyrx.net/");
    expect(browser.dataLayer).toEqual([{ event: "CompleteRegistration" }]);
  });

  it("never tracks intake, checkout, support or protected pages", () => {
    saveAnalyticsChoice("accepted");
    for (const path of [
      "/qualify",
      "/checkout",
      "/start/sema",
      "/contact-us",
      "/auth",
      "/account",
      "/admin",
      "/travis",
    ]) {
      expect(isTrackingExcludedPage(path)).toBe(true);
      browser.location.pathname = path;
      trackFunnelEvent("PageView", {});
    }
    expect(requests).not.toHaveBeenCalled();
    expect(browser.dataLayer).toEqual([]);
  });
});
