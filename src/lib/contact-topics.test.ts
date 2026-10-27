import { describe, expect, it } from "vitest";
import { CONTACT_SUBJECTS, contactRouteFor, parseContactSubject } from "./contact-topics";
import { runWithStartContext } from "@tanstack/start-storage-context";
// @ts-expect-error Vite virtual server-function module has no declaration.
import * as fns from "./contact.functions.ts?tss-serverfn-split";

describe("contact subjects", () => {
  it("offers account, payment, order, delivery, general and medical topics", () => {
    expect(CONTACT_SUBJECTS.map((s) => s.value)).toEqual([
      "account", "payment", "order", "delivery", "support", "medical",
    ]);
  });

  it("routes only Medical question to the medical channel", () => {
    expect(contactRouteFor("medical")).toBe("medical");
    for (const s of CONTACT_SUBJECTS.filter((s) => s.value !== "medical")) {
      expect(contactRouteFor(s.value)).toBe("general");
    }
    expect(contactRouteFor("unknown")).toBeNull();
  });
});

describe("submitContactMessage", () => {
  const payloads = [
    { data: { name: "A", email: "a@example.com", phone: "", subject: "order", message: "Where is my package?" } },
    { data: { name: "A", email: "a@example.com", phone: "", subject: "medical", message: "I feel dizzy" } },
    {},
  ];
  it.each(payloads)("rejects every direct call", async (payload) => {
    const result = await runWithStartContext(
      { contextAfterGlobalMiddlewares: {}, request: new Request("http://localhost") } as never,
      () => fns.submitContactMessage_createServerFn_handler(payload),
    );
    expect((result as { result: unknown }).result).toEqual({ ok: false, reason: "unavailable" });
  });
});

describe("parseContactSubject", () => {
  it("accepts only known subjects for URL preselection", () => {
    expect(parseContactSubject("medical")).toBe("medical");
    expect(parseContactSubject("order")).toBe("order");
    expect(parseContactSubject("MEDICAL")).toBeUndefined();
    expect(parseContactSubject("<script>")).toBeUndefined();
    expect(parseContactSubject(undefined)).toBeUndefined();
    expect(parseContactSubject(["medical"])).toBeUndefined();
  });
});
