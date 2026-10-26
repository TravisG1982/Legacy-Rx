// src/lib/stripe-test.server.ts — LegacyRX test-mode Stripe payments.
// Server-only. Separate from FuseHealth and from the removed legacy Stripe code.
// Refuses to run unless explicitly enabled AND configured with a Stripe *test* key.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import Stripe from "stripe";

export class StripeTestUnavailableError extends Error {}

const OPAQUE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function stripeTestEnabled(): boolean {
  const key = process.env["STRIPE_TEST_SECRET_KEY"];
  return process.env["STRIPE_TEST_PAYMENTS_ENABLED"] === "true" && !!key && key.startsWith("sk_test_");
}

export function requireStripeTest(): Stripe {
  if (!stripeTestEnabled()) throw new StripeTestUnavailableError("Test payments are not available.");
  return new Stripe(process.env["STRIPE_TEST_SECRET_KEY"]!);
}

/**
 * PROVISIONAL: when to authorize and capture is still to be agreed with Beluga.
 * Default is immediate capture; set STRIPE_TEST_CAPTURE_METHOD=manual to exercise authorize-only.
 */
export function captureMethod(): "automatic" | "manual" {
  return process.env["STRIPE_TEST_CAPTURE_METHOD"] === "manual" ? "manual" : "automatic";
}

export function newAccessToken() {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenMatches(token: string, storedHash: string): boolean {
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isOpaqueId(value: unknown): value is string {
  return typeof value === "string" && OPAQUE_ID.test(value);
}

export type StripeTestEffect = {
  orderId: string;
  sessionId: string | null;
  paymentIntentId: string | null;
  target: "pending_payment" | "abandoned" | "payment_failed" | "authorized" | "paid";
  amountCents: number | null;
  currency: string | null;
};

const idOf = (v: unknown): string | null =>
  typeof v === "string" ? v : v && typeof v === "object" && typeof (v as { id?: unknown }).id === "string" ? (v as { id: string }).id : null;

/** Maps a verified event to an order effect, or null when the event is irrelevant to the order. */
export function effectOf(event: Stripe.Event): StripeTestEffect | null {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired": {
      const s = event.data.object as Stripe.Checkout.Session;
      const orderId = s.metadata?.["order_id"] ?? s.client_reference_id;
      if (!isOpaqueId(orderId)) return null;
      let target: StripeTestEffect["target"] | null = null;
      if (event.type === "checkout.session.expired") target = "abandoned";
      else if (event.type === "checkout.session.async_payment_failed") target = "payment_failed";
      else if (event.type === "checkout.session.async_payment_succeeded") target = "paid";
      // With manual capture a completed session is still "unpaid". Bind its
      // PaymentIntent now so a later PI event can be verified against it.
      else if (s.payment_status === "paid") target = "paid";
      else target = "pending_payment";
      if (!target) return null;
      return { orderId, sessionId: s.id, paymentIntentId: idOf(s.payment_intent), target, amountCents: s.amount_total ?? null, currency: s.currency ?? null };
    }
    case "payment_intent.succeeded":
    case "payment_intent.amount_capturable_updated":
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.["order_id"];
      if (!isOpaqueId(orderId)) return null;
      const target = event.type === "payment_intent.succeeded" ? "paid" : event.type === "payment_intent.payment_failed" ? "payment_failed" : "authorized";
      const amount = target === "paid" ? pi.amount_received : pi.amount;
      return { orderId, sessionId: null, paymentIntentId: pi.id, target, amountCents: amount ?? null, currency: pi.currency ?? null };
    }
    default:
      return null;
  }
}
