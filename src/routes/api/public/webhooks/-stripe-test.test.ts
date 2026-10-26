import { beforeEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc } }));

import { Route } from "./stripe-test";

const handler = (Route.options.server!.handlers as { POST: (a: { request: Request }) => Promise<Response> }).POST;
const SECRET = "whsec_synthetic_test_secret";
const ORDER = "11111111-1111-1111-1111-111111111111";
const stripe = new Stripe("sk_test_synthetic");

function body(over: Record<string, unknown> = {}, type = "checkout.session.completed", id = "evt_1") {
  return JSON.stringify({
    id, object: "event", type, livemode: false,
    data: { object: { id: "cs_1", object: "checkout.session", payment_status: "paid", amount_total: 50600, currency: "usd", payment_intent: "pi_1", metadata: { order_id: ORDER }, ...over } },
  });
}
const signed = (payload: string, secret = SECRET) => stripe.webhooks.generateTestHeaderString({ payload, secret });
const req = (payload: string, signature: string | null) =>
  new Request("https://example.test/api/public/webhooks/stripe-test", { method: "POST", headers: signature ? { "stripe-signature": signature } : {}, body: payload });

beforeEach(() => {
  rpc.mockReset().mockResolvedValue({ data: "applied", error: null });
  process.env["STRIPE_TEST_PAYMENTS_ENABLED"] = "true";
  process.env["STRIPE_TEST_SECRET_KEY"] = "sk_test_synthetic";
  process.env["STRIPE_TEST_WEBHOOK_SECRET"] = SECRET;
});

describe("Stripe test webhook", () => {
  it("applies a correctly signed success event with opaque ids only", async () => {
    const res = await handler({ request: req(body(), signed(body())) });
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("apply_payment_test_event", {
      p_event_id: "evt_1", p_event_type: "checkout.session.completed", p_order_id: ORDER,
      p_session_id: "cs_1", p_payment_intent_id: "pi_1", p_target_status: "paid", p_amount_cents: 50600, p_currency: "usd",
    });
  });

  it("rejects a missing, wrong-secret or tampered signature without touching the database", async () => {
    expect((await handler({ request: req(body(), null) })).status).toBe(400);
    expect((await handler({ request: req(body(), signed(body(), "whsec_other")) })).status).toBe(400);
    const tampered = body({ amount_total: 1 });
    expect((await handler({ request: req(tampered, signed(body())) })).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects a stale signed event", async () => {
    const payload = body();
    const old = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET, timestamp: Math.floor(Date.now() / 1000) - 3600 });
    expect((await handler({ request: req(payload, old) })).status).toBe(400);
  });

  it("rejects live-mode events", async () => {
    const payload = body().replace('"livemode":false', '"livemode":true');
    expect((await handler({ request: req(payload, signed(payload)) })).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("reports a duplicate as success so Stripe stops retrying", async () => {
    rpc.mockResolvedValue({ data: "duplicate", error: null });
    const res = await handler({ request: req(body(), signed(body())) });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ result: "duplicate" });
  });

  it("asks Stripe to retry when the order is unknown or storage fails", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "P0002" } });
    expect((await handler({ request: req(body(), signed(body())) })).status).toBe(503);
  });

  it("acknowledges but ignores unrelated events and events without an opaque order id", async () => {
    const other = body({}, "customer.created");
    expect((await handler({ request: req(other, signed(other)) })).status).toBe(200);
    const foreign = body({ metadata: { order_id: "not-ours" } });
    expect((await handler({ request: req(foreign, signed(foreign)) })).status).toBe(200);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps failure, expiry and manual-capture authorization", async () => {
    const failed = JSON.stringify({ id: "evt_f", object: "event", type: "payment_intent.payment_failed", livemode: false, data: { object: { id: "pi_1", object: "payment_intent", amount: 50600, currency: "usd", metadata: { order_id: ORDER } } } });
    await handler({ request: req(failed, signed(failed)) });
    expect(rpc.mock.calls[0]![1]).toMatchObject({ p_target_status: "payment_failed", p_session_id: null });
    const expired = body({ payment_status: "unpaid" }, "checkout.session.expired", "evt_e");
    await handler({ request: req(expired, signed(expired)) });
    expect(rpc.mock.calls[1]![1]).toMatchObject({ p_target_status: "abandoned" });
    const unpaid = body({ payment_status: "unpaid" }, "checkout.session.completed", "evt_u");
    await handler({ request: req(unpaid, signed(unpaid)) });
    expect(rpc.mock.calls[2]![1]).toMatchObject({ p_target_status: "pending_payment", p_payment_intent_id: "pi_1" });
    const auth = JSON.stringify({ id: "evt_a", object: "event", type: "payment_intent.amount_capturable_updated", livemode: false, data: { object: { id: "pi_1", object: "payment_intent", amount: 50600, currency: "usd", metadata: { order_id: ORDER } } } });
    await handler({ request: req(auth, signed(auth)) });
    expect(rpc.mock.calls[3]![1]).toMatchObject({ p_target_status: "authorized" });
  });

  it("is unavailable unless test payments are enabled with a test key", async () => {
    process.env["STRIPE_TEST_SECRET_KEY"] = "sk_live_synthetic";
    expect((await handler({ request: req(body(), signed(body())) })).status).toBe(404);
    process.env["STRIPE_TEST_SECRET_KEY"] = "sk_test_synthetic";
    process.env["STRIPE_TEST_PAYMENTS_ENABLED"] = "false";
    expect((await handler({ request: req(body(), signed(body())) })).status).toBe(404);
  });
});
