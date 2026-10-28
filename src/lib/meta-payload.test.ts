import { describe, expect, it } from "vitest";
import {
  baseUserData,
  buildMetaPayload,
  isBrowserPixelEvent,
  type MetaEventPayload,
} from "./analytics";
import { HEALTH_CATEGORY_PATTERN } from "./meta-safe-title";

/**
 * Data-minimization guard. If someone widens the Meta payload later, this fails.
 */

const ALLOWED_TOP_LEVEL = new Set([
  "event_name",
  "event_id",
  "event_time",
  "event_source_url",
  "action_source",
  "user_data",
  "test_event_code",
]);

const ALLOWED_USER_DATA = new Set(["client_user_agent", "fbp", "fbc", "external_id"]);

function payload(): MetaEventPayload {
  return buildMetaPayload("AddToCart", "evt-1", {
    sourceUrl: "https://legacyrx.net/qualify",
    userData: { client_user_agent: "UA", fbp: "fb.1.1.1", external_id: "abc" },
  });
}

describe("Meta payload minimization", () => {
  it("only carries allow-listed top-level keys", () => {
    for (const key of Object.keys(payload())) {
      expect(ALLOWED_TOP_LEVEL.has(key), `unexpected key: ${key}`).toBe(true);
    }
  });

  it("only carries anonymized user_data keys", () => {
    for (const key of Object.keys(payload().user_data)) {
      expect(ALLOWED_USER_DATA.has(key), `unexpected user_data key: ${key}`).toBe(true);
    }
  });

  it("does not include a monetary value that could imply a product", () => {
    expect("custom_data" in payload()).toBe(false);
  });

  it("carries no health-category term anywhere", () => {
    expect(HEALTH_CATEGORY_PATTERN.test(JSON.stringify(payload()))).toBe(false);
  });

  it("omits custom_data for non-monetary events", () => {
    const p = buildMetaPayload("PageView", "evt-2", { sourceUrl: "https://legacyrx.net/" });
    expect("custom_data" in p).toBe(false);
  });

  it("strips query strings from the source url it is given", () => {
    const p = buildMetaPayload("PageView", "evt-3", {
      sourceUrl: "https://legacyrx.net/start/sema?email=patient%40example.com",
    });
    expect(p.event_source_url).toBe("https://legacyrx.net/");
  });

  it("keeps the client event_time it is given", () => {
    const t = 1700000000;
    expect(buildMetaPayload("Purchase", "evt-4", { eventTime: t }).event_time).toBe(t);
  });

  it("passes a long fbc through unmodified - no lowercasing, no truncation", () => {
    const fbclid = `IwY2xjawAbCdEf${"Xy9Z_-Ab".repeat(40)}`;
    const fbc = `fb.1.1700000000000.${fbclid}`;
    expect(fbc.length).toBeGreaterThan(300);
    const p = buildMetaPayload("AddToCart", "evt-5", {
      sourceUrl: "https://legacyrx.net/checkout",
      userData: { client_user_agent: "UA", fbp: "fb.1.1.1", fbc, external_id: "abc" },
    });
    expect(p.user_data.fbc).toBe(fbc);
  });

  it("carries no contact or address key on any event", () => {
    const forbidden = [
      "em",
      "ph",
      "fn",
      "ln",
      "ct",
      "st",
      "zp",
      "country",
      "email",
      "phone",
      "first_name",
      "last_name",
      "city",
      "state",
      "zip",
      "content_name",
      "content_ids",
      "contents",
      "order_id",
    ];
    const events = [
      "PageView",
      "ViewContent",
      "CompleteRegistration",
      "AddToCart",
      "InitiateCheckout",
      "Purchase",
    ] as const;
    for (const name of events) {
      const p = buildMetaPayload(name, "evt", {
        sourceUrl: "https://legacyrx.net/checkout",
        userData: { client_user_agent: "UA", fbp: "fb.1.1.1", external_id: "abc" },
      });
      const keys = [...Object.keys(p), ...Object.keys(p.user_data)];
      for (const bad of forbidden) {
        expect(keys.includes(bad), `${name} leaked ${bad}`).toBe(false);
      }
    }
  });

  it("builds a payload without generating any identifier or cookie while disabled", () => {
    expect(baseUserData()).toEqual({});
    const p = buildMetaPayload("PageView", "evt-6", { sourceUrl: "https://legacyrx.net/" });
    expect(p.user_data).toEqual({});
    expect("test_event_code" in p).toBe(false);
  });

  describe("transport routing", () => {
    it("routes no event through the browser Pixel", () => {
      for (const name of [
        "PageView",
        "ViewContent",
        "CompleteRegistration",
        "AddToCart",
        "InitiateCheckout",
        "Purchase",
      ] as const) {
        expect(isBrowserPixelEvent(name), `${name} must not fire in the browser`).toBe(false);
      }
    });
  });
});

describe("health category pattern", () => {
  it("matches the real SEO titles we must neutralize", () => {
    expect(HEALTH_CATEGORY_PATTERN.test("LegacyRX.net | Physician-Led Medical Weight Loss")).toBe(
      true,
    );
    expect(HEALTH_CATEGORY_PATTERN.test("Semaglutide & Tirzepatide - LegacyRX")).toBe(true);
    expect(HEALTH_CATEGORY_PATTERN.test("LegacyRX")).toBe(false);
  });
});
