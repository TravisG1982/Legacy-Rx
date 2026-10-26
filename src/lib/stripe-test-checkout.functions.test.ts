import { beforeEach, describe, expect, it, vi } from "vitest";
import { runWithStartContext } from "@tanstack/start-storage-context";
import { MEDS } from "./legacyrx-data";

type Row = Record<string, unknown>;
const mocks = vi.hoisted(() => ({
  orders: [] as Row[],
  sessionCreate: vi.fn(),
  sessionRetrieve: vi.fn(),
  sessionExpire: vi.fn(),
  requireAssessment: vi.fn(),
  failSessionSave: false,
}));

vi.mock("stripe", () => ({
  default: class {
    checkout = { sessions: { create: mocks.sessionCreate, retrieve: mocks.sessionRetrieve, expire: mocks.sessionExpire } };
  },
}));
vi.mock("./assessment.server", () => ({ requireCompletedAssessment: mocks.requireAssessment }));
vi.mock("./account-access.server", () => ({ verifiedAccountEmail: async () => "buyer@example.test" }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({
  requireSupabaseAuth: { options: { server: async ({ next }: { next: (o: unknown) => unknown }) => next({ context: { userId: "test-user" } }) } },
}));
vi.mock("@/integrations/supabase/client.server", () => {
  const build = (filters: Array<(r: Row) => boolean> = [], mode: "select" | "update" | "insert" = "select", patch?: Row, inserted?: Row) => {
    const q: Record<string, unknown> = {};
    const add = (f: (r: Row) => boolean) => build([...filters, f], mode, patch, inserted);
    q["select"] = () => build(filters, mode, patch, inserted);
    q["eq"] = (c: string, v: unknown) => add((r) => r[c] === v);
    q["in"] = (c: string, vs: unknown[]) => add((r) => vs.includes(r[c]));
    q["is"] = (c: string, v: unknown) => add((r) => r[c] === v || (v === null && r[c] == null));
    const run = () => {
      const hit = mocks.orders.filter((r) => filters.every((f) => f(r)));
      if (mode === "update") {
        if (mocks.failSessionSave && patch?.["stripe_session_id"]) return { data: null, error: { message: "save failed" } };
        for (const r of hit) Object.assign(r, patch);
        return { data: hit, error: null };
      }
      return { data: hit, error: null };
    };
    q["maybeSingle"] = async () => { const r = run(); return { data: (r.data as Row[] | null)?.[0] ?? null, error: r.error }; };
    q["single"] = async () => ({ data: inserted ?? null, error: null });
    q["then"] = (res: (v: unknown) => unknown) => Promise.resolve(run()).then(res);
    return q;
  };
  return {
    supabaseAdmin: {
      from: () => ({
        select: () => build(),
        update: (patch: Row) => build([], "update", patch),
        insert: (row: Row) => {
          const dup = mocks.orders.some((r) => r["email"] === row["email"] && r["medication"] === row["medication"] && r["plan_id"] === row["plan_id"] && ["pending_payment", "payment_failed"].includes(String(r["status"])));
          if (dup) return { select: () => ({ single: async () => ({ data: null, error: { code: "23505" } }) }) };
          const created = { status: "pending_payment", stripe_session_id: null, ...row, id: `00000000-0000-0000-0000-${String(mocks.orders.length + 1).padStart(12, "0")}` };
          mocks.orders.push(created);
          return { select: () => ({ single: async () => ({ data: { id: created.id }, error: null }) }) };
        },
      }),
    },
  };
});

// @ts-expect-error Vite virtual server-function module has no declaration.
import * as fns from "./stripe-test-checkout.functions.ts?tss-serverfn-split";
import { serverAmountCents } from "./stripe-test-checkout.functions";
import { hashToken } from "./stripe-test.server";

const input = { med: "sema", plan: "3", email: "Buyer@Example.test" };
const run = (name: string, data: unknown) =>
  runWithStartContext({ contextAfterGlobalMiddlewares: { userId: "test-user" }, request: new Request("http://localhost") } as never, () => fns[name]({ data, context: { userId: "test-user" } }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.orders.length = 0;
  mocks.failSessionSave = false;
  process.env["STRIPE_TEST_PAYMENTS_ENABLED"] = "true";
  process.env["STRIPE_TEST_SECRET_KEY"] = "sk_test_synthetic";
  process.env["STRIPE_TEST_ALLOWED_EMAIL"] = "buyer@example.test";
  process.env["STRIPE_TEST_RETURN_ORIGIN"] = "https://preview.example.test";
  delete process.env["STRIPE_TEST_CAPTURE_METHOD"];
  mocks.requireAssessment.mockResolvedValue(undefined);
  mocks.sessionCreate.mockImplementation(async () => ({ id: "cs_new", url: "https://checkout.stripe.test/c/cs_new", livemode: false }));
});

describe("test payment creation", () => {
  it("charges the catalog amount and sends only opaque identifiers to Stripe", async () => {
    const out = await run("createStripeTestPayment_createServerFn_handler", { ...input, amount: 1, unit_amount: 1 });
    expect(out.result).toEqual({ url: "https://checkout.stripe.test/c/cs_new" });
    const [params, opts] = mocks.sessionCreate.mock.calls[0]!;
    const expected = Math.round(MEDS.sema.plans.find((p) => p.id === "3")!.total * 100);
    expect(params.line_items[0].price_data.unit_amount).toBe(expected);
    expect(params.mode).toBe("payment");
    expect(params.payment_intent_data.capture_method).toBe("automatic");
    const sent = JSON.stringify(params);
    expect(sent).not.toMatch(/buyer@example|sema|semaglutide|medication/i);
    expect(params.metadata).toEqual({ order_id: params.client_reference_id });
    expect(opts.idempotencyKey).toContain(params.client_reference_id);
    expect(mocks.orders[0]).toMatchObject({ amount_cents: expected, email: "buyer@example.test", status: "pending_payment" });
    // The access token is only in the Stripe return URL; the database keeps its hash.
    const token = new URL(params.success_url).searchParams.get("t")!;
    expect(mocks.orders[0]!["access_token_hash"]).toBe(hashToken(token));
    expect(JSON.stringify(mocks.orders[0])).not.toContain(token);
  });

  it("derives the amount on the server and rejects unknown products or plans", () => {
    expect(serverAmountCents("sema", "3")).toBeGreaterThan(0);
    expect(serverAmountCents("sema", "999")).toBeNull();
  });

  it("reuses the open session on a repeated click instead of creating a second order", async () => {
    await run("createStripeTestPayment_createServerFn_handler", input);
    mocks.orders[0]!["stripe_session_id"] = "cs_new";
    mocks.sessionRetrieve.mockResolvedValue({ status: "open", url: "https://checkout.stripe.test/c/cs_new" });
    const second = await run("createStripeTestPayment_createServerFn_handler", input);
    expect(second.result).toEqual({ url: "https://checkout.stripe.test/c/cs_new" });
    expect(mocks.orders).toHaveLength(1);
    expect(mocks.sessionCreate).toHaveBeenCalledTimes(1);
  });

  it("replaces an expired open attempt with a new order", async () => {
    await run("createStripeTestPayment_createServerFn_handler", input);
    mocks.orders[0]!["stripe_session_id"] = "cs_new";
    mocks.sessionRetrieve.mockResolvedValue({ status: "expired", url: null });
    await run("createStripeTestPayment_createServerFn_handler", input);
    expect(mocks.orders.map((o) => o["status"])).toEqual(["abandoned", "pending_payment"]);
    expect(mocks.sessionCreate).toHaveBeenCalledTimes(2);
  });

  it("requires a completed assessment for the same email", async () => {
    mocks.requireAssessment.mockRejectedValue(new Error("Complete the assessment before starting checkout."));
    const out = await run("createStripeTestPayment_createServerFn_handler", input);
    expect(out.error).toBeTruthy();
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
    expect(mocks.orders).toEqual([]);
  });

  it("refuses to run without the flag or with a non-test key", async () => {
    process.env["STRIPE_TEST_SECRET_KEY"] = "sk_live_synthetic";
    expect((await run("createStripeTestPayment_createServerFn_handler", input)).error).toBeTruthy();
    process.env["STRIPE_TEST_SECRET_KEY"] = "sk_test_synthetic";
    process.env["STRIPE_TEST_PAYMENTS_ENABLED"] = "";
    expect((await run("createStripeTestPayment_createServerFn_handler", input)).error).toBeTruthy();
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });

  it("refuses an unapproved test identity", async () => {
    process.env["STRIPE_TEST_ALLOWED_EMAIL"] = "other@example.test";
    expect((await run("createStripeTestPayment_createServerFn_handler", input)).error).toBeTruthy();
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });

  it("rejects a missing or unsafe return origin before creating an order", async () => {
    // Reject embedded credentials that could obscure the actual return host.
    process.env["STRIPE_TEST_RETURN_ORIGIN"] = "https://preview.example.test@evil.test";
    expect((await run("createStripeTestPayment_createServerFn_handler", input)).error).toBeTruthy();
    expect(mocks.orders).toEqual([]);
    delete process.env["STRIPE_TEST_RETURN_ORIGIN"];
    expect((await run("createStripeTestPayment_createServerFn_handler", input)).error).toBeTruthy();
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });

  it("does not return a checkout URL when its session ID could not be stored", async () => {
    mocks.failSessionSave = true;
    const out = await run("createStripeTestPayment_createServerFn_handler", input);
    expect(out.error).toBeTruthy();
    expect(mocks.sessionExpire).toHaveBeenCalledWith("cs_new");
    expect(mocks.orders[0]!["status"]).toBe("abandoned");
  });

  it("honours the provisional manual-capture setting and rejects a live session", async () => {
    process.env["STRIPE_TEST_CAPTURE_METHOD"] = "manual";
    await run("createStripeTestPayment_createServerFn_handler", input);
    expect(mocks.sessionCreate.mock.calls[0]![0].payment_intent_data.capture_method).toBe("manual");
    mocks.orders.length = 0;
    mocks.sessionCreate.mockResolvedValue({ id: "cs_live", url: "https://x", livemode: true });
    expect((await run("createStripeTestPayment_createServerFn_handler", input)).error).toBeTruthy();
    expect(mocks.orders[0]!["status"]).toBe("abandoned");
  });
});

describe("test order status access", () => {
  const id = "00000000-0000-0000-0000-000000000001";
  const token = "a".repeat(64);
  beforeEach(() => {
    mocks.orders.push({ id, order_number: "LRXT-1", status: "paid", amount_cents: 100, access_token_hash: hashToken(token) });
  });

  it("returns the order only for the matching token", async () => {
    const ok = await run("getStripeTestOrderStatus_createServerFn_handler", { orderId: id, token });
    expect(ok.result).toEqual({ orderNumber: "LRXT-1", status: "paid", amountCents: 100 });
    expect(JSON.stringify(ok.result)).not.toContain(hashToken(token));
  });

  it("treats someone else's order, a wrong token and an unknown id identically", async () => {
    const wrong = await run("getStripeTestOrderStatus_createServerFn_handler", { orderId: id, token: "b".repeat(64) });
    const unknown = await run("getStripeTestOrderStatus_createServerFn_handler", { orderId: "00000000-0000-0000-0000-000000000009", token });
    expect(wrong.error?.message).toBe("This order is not available.");
    expect(unknown.error?.message).toBe("This order is not available.");
    expect((await run("getStripeTestOrderStatus_createServerFn_handler", { orderId: id, token: "short" })).error).toBeTruthy();
  });
});
