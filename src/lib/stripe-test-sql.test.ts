// Runs the real migration SQL on an in-process Postgres (PGlite) with synthetic rows.
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
const O = (n: number) => `${String(n).repeat(8)}-${String(n).repeat(4)}-${String(n).repeat(4)}-${String(n).repeat(4)}-${String(n).repeat(12)}`;

const order = (id: string, email = `${id.slice(0, 4)}@example.test`, amount = 50600) =>
  db.query(
    `insert into payment_test_orders(id,order_number,email,medication,plan_id,amount_cents,access_token_hash) values($1,$2,$3,'sema','3',$4,'h')`,
    [id, `N-${id.slice(0, 4)}`, email, amount],
  );

async function event(
  id: string,
  type: string,
  target: string,
  o: { order?: string; session?: string | null; pi?: string; amount?: number | null; cur?: string } = {},
) {
  const r = await db.query<{ r: string }>(`select public.apply_payment_test_event($1,$2,$3,$4,$5,$6,$7,$8) r`, [
    id, type, o.order ?? O(1), o.session === undefined ? "cs_1" : o.session, o.pi ?? "pi_1", target, o.amount === undefined ? 50600 : o.amount, o.cur ?? "usd",
  ]);
  return r.rows[0]!.r;
}
const status = async (id = O(1)) => (await db.query<{ status: string }>(`select status from payment_test_orders where id=$1`, [id])).rows[0]!.status;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role service_role; create role anon; create role authenticated;
    create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;`);
  await db.exec(readFileSync("supabase/migrations/20261026130000_create_stripe_test_payments.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/20261026140000_fix_stripe_test_failed_intent.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/20261026150000_harden_stripe_test_failed_amount.sql", "utf8"));
});

describe("apply_payment_test_event (real SQL, synthetic data)", () => {
  it("applies success, ignores a duplicate event id and late downgrades", async () => {
    await order(O(1));
    expect(await event("evt_1", "checkout.session.completed", "paid")).toBe("applied");
    expect(await event("evt_1", "checkout.session.completed", "paid")).toBe("duplicate");
    expect(await event("evt_2", "payment_intent.payment_failed", "payment_failed")).toBe("ignored");
    expect(await event("evt_3", "checkout.session.expired", "abandoned")).toBe("ignored");
    expect(await event("evt_4", "payment_intent.succeeded", "paid")).toBe("ignored");
    expect(await status()).toBe("paid");
  });

  it("lets a retry succeed after a failed attempt", async () => {
    await order(O(2));
    await event("evt_5_bind", "checkout.session.completed", "pending_payment", { order: O(2), session: "cs_2" });
    expect(await event("evt_5", "payment_intent.payment_failed", "payment_failed", { order: O(2), session: null, pi: "pi_1" })).toBe("applied");
    expect(await status(O(2))).toBe("payment_failed");
    expect(await event("evt_6", "checkout.session.completed", "paid", { order: O(2), session: "cs_2" })).toBe("applied");
    expect(await status(O(2))).toBe("paid");
  });

  it("records a declined card while Checkout is open, before any completed-session event", async () => {
    const id = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    await order(id);
    await db.query("update payment_test_orders set stripe_session_id=$1 where id=$2", ["cs_declined", id]);
    expect(await event("evt_declined", "payment_intent.payment_failed", "payment_failed", { order: id, session: null, pi: "pi_declined" })).toBe("applied");
    expect(await status(id)).toBe("payment_failed");
    expect(await event("evt_declined", "payment_intent.payment_failed", "payment_failed", { order: id, session: null, pi: "pi_declined" })).toBe("duplicate");
    expect(await event("evt_declined_again", "payment_intent.payment_failed", "payment_failed", { order: id, session: null, pi: "pi_other" })).toBe("ignored");
    expect(await event("evt_declined_then_paid", "checkout.session.completed", "paid", { order: id, session: "cs_declined", pi: "pi_paid" })).toBe("applied");
    expect(await status(id)).toBe("paid");
  });

  it("does not accept an unbound failure without our session or with wrong amount/currency", async () => {
    const id = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    await order(id);
    const failure = (eventId: string, amount: number | null = 50600, cur = "usd") =>
      event(eventId, "payment_intent.payment_failed", "payment_failed", { order: id, session: null, pi: "pi_unbound", amount, cur });
    await expect(failure("evt_no_session")).rejects.toThrow();
    await db.query("update payment_test_orders set stripe_session_id=$1 where id=$2", ["cs_check", id]);
    await expect(failure("evt_wrong_amount", 1)).rejects.toThrow();
    await expect(failure("evt_null_amount", null)).rejects.toThrow();
    await expect(failure("evt_wrong_currency", 50600, "eur")).rejects.toThrow();
    expect(await status(id)).toBe("pending_payment");
    expect(await failure("evt_no_session")).toBe("applied");
  });

  it("never marks a wrong amount or currency as paid", async () => {
    await order(O(3));
    await order(O(4));
    expect(await event("evt_7", "checkout.session.completed", "paid", { order: O(3), session: "cs_3", amount: 100 })).toBe("mismatch");
    expect(await status(O(3))).toBe("order_error");
    expect(await event("evt_8", "checkout.session.completed", "paid", { order: O(4), session: "cs_4", cur: "eur" })).toBe("mismatch");
  });

  it("supports authorize-then-capture without fixing the capture timing", async () => {
    await order(O(5));
    expect(await event("evt_9_bind", "checkout.session.completed", "pending_payment", { order: O(5), session: "cs_5", pi: "pi_5" })).toBe("ignored");
    expect(await event("evt_9", "payment_intent.amount_capturable_updated", "authorized", { order: O(5), session: null, pi: "pi_5" })).toBe("applied");
    expect(await status(O(5))).toBe("authorized");
    expect(await event("evt_10", "payment_intent.succeeded", "paid", { order: O(5), session: null, pi: "pi_5" })).toBe("applied");
    expect(await status(O(5))).toBe("paid");
  });

  it("ignores events for a different session of the same order", async () => {
    await order(O(6));
    await event("evt_11_bind", "checkout.session.completed", "pending_payment", { order: O(6), session: "cs_6" });
    await event("evt_11", "payment_intent.payment_failed", "payment_failed", { order: O(6), session: null });
    expect(await event("evt_12", "checkout.session.completed", "paid", { order: O(6), session: "cs_OTHER" })).toBe("ignored");
    expect(await status(O(6))).toBe("payment_failed");
  });

  it("ignores a different PaymentIntent even when the event names the same order", async () => {
    await order(O(8));
    await event("evt_pi_bind", "checkout.session.completed", "pending_payment", { order: O(8), session: "cs_8", pi: "pi_real" });
    expect(await event("evt_pi_1", "payment_intent.amount_capturable_updated", "authorized", { order: O(8), session: null, pi: "pi_real" })).toBe("applied");
    await expect(event("evt_pi_2", "payment_intent.succeeded", "paid", { order: O(8), session: null, pi: "pi_other" })).rejects.toThrow();
    expect(await status(O(8))).toBe("authorized");
  });

  it("retries a PaymentIntent event delivered before the Checkout session binds it", async () => {
    await order(O(9));
    await expect(event("evt_early", "payment_intent.succeeded", "paid", { order: O(9), session: null, pi: "pi_9" })).rejects.toThrow();
    const rows = await db.query<{ c: number }>("select count(*)::int c from payment_test_webhook_events where event_id='evt_early'");
    expect(rows.rows[0]!.c).toBe(0);
    await event("evt_bind_late", "checkout.session.completed", "pending_payment", { order: O(9), session: "cs_9", pi: "pi_9" });
    expect(await event("evt_early", "payment_intent.succeeded", "paid", { order: O(9), session: null, pi: "pi_9" })).toBe("applied");
  });

  it("accepts a replacement PaymentIntent only when the same signed Checkout session identifies it", async () => {
    await order(O(0));
    await event("evt_replace_bind", "checkout.session.completed", "pending_payment", { order: O(0), session: "cs_replace", pi: "pi_failed" });
    await event("evt_replace_fail", "payment_intent.payment_failed", "payment_failed", { order: O(0), session: null, pi: "pi_failed" });
    expect(await event("evt_replace_new", "checkout.session.completed", "paid", { order: O(0), session: "cs_replace", pi: "pi_success" })).toBe("applied");
    expect(await status(O(0))).toBe("paid");
    expect(await event("evt_replace_old", "payment_intent.payment_failed", "payment_failed", { order: O(0), session: null, pi: "pi_failed" })).toBe("ignored");
  });

  it("retries a replacement PI authorization until the same session binds the replacement", async () => {
    const replacementOrder = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    await order(replacementOrder);
    await event("evt_retry_bind_old", "checkout.session.completed", "pending_payment", { order: replacementOrder, session: "cs_retry", pi: "pi_old" });
    await event("evt_retry_fail", "payment_intent.payment_failed", "payment_failed", { order: replacementOrder, session: null, pi: "pi_old" });
    await expect(event("evt_retry_auth", "payment_intent.amount_capturable_updated", "authorized", { order: replacementOrder, session: null, pi: "pi_new" })).rejects.toThrow();
    await event("evt_retry_bind_new", "checkout.session.completed", "pending_payment", { order: replacementOrder, session: "cs_retry", pi: "pi_new" });
    expect(await event("evt_retry_auth", "payment_intent.amount_capturable_updated", "authorized", { order: replacementOrder, session: null, pi: "pi_new" })).toBe("applied");
    expect(await status(replacementOrder)).toBe("authorized");
  });

  it("does not consume the event id when the order is unknown, so a retry works later", async () => {
    await expect(event("evt_13", "checkout.session.completed", "paid", { order: O(7) })).rejects.toThrow();
    expect((await db.query<{ c: number }>(`select count(*)::int c from payment_test_webhook_events where event_id='evt_13'`)).rows[0]!.c).toBe(0);
    await order(O(7));
    expect(await event("evt_13", "checkout.session.completed", "paid", { order: O(7), session: "cs_7" })).toBe("applied");
  });

  it("allows one open attempt per buyer and product, and rejects bad data", async () => {
    const insert = (n: string, email: string, plan = "3", amount = 100) =>
      db.query(`insert into payment_test_orders(order_number,email,medication,plan_id,amount_cents,access_token_hash) values($1,$2,'sema',$3,$4,'h')`, [n, email, plan, amount]);
    await insert("X1", "dup@example.test");
    await expect(insert("X2", "DUP@example.test")).rejects.toThrow();
    await insert("X3", "dup@example.test", "6");
    await expect(insert("X4", "zero@example.test", "3", 0)).rejects.toThrow();
    await expect(event("evt_14", "x", "refunded")).rejects.toThrow();
  });
});
