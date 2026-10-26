import { beforeEach, describe, expect, it, vi } from "vitest";
import { runWithStartContext } from "@tanstack/start-storage-context";

const mocks = vi.hoisted(() => ({ tables: [] as string[], columns: "" , rows: [] as Record<string, unknown>[] }));

vi.mock("@/integrations/supabase/auth-middleware", () => ({
  requireSupabaseAuth: { options: { server: async ({ next }: { next: (o: unknown) => unknown }) => next({ context: { userId: "user-1" } }) } },
}));
vi.mock("./account-access.server", () => ({
  verifiedAccountEmail: async () => "verified@example.com",
  sameVerifiedEmail: (stored: string, verified: string) => stored.trim().toLowerCase() === verified,
}));
vi.mock("@/integrations/supabase/client.server", () => {
  const q: Record<string, unknown> = {};
  for (const m of ["eq", "ilike", "neq", "order"]) q[m] = () => q;
  q["select"] = (cols: string) => { mocks.columns = cols; return q; };
  q["limit"] = async () => ({ data: mocks.rows, error: null });
  return { supabaseAdmin: { from: (t: string) => { mocks.tables.push(t); return q; } } };
});

// @ts-expect-error Vite virtual server-function module has no declaration.
import * as fns from "./account.functions.ts?tss-serverfn-split";

beforeEach(() => {
  mocks.tables.length = 0;
  mocks.rows = [
    { order_number: "LRX-1", status: "paid", email: "Verified@Example.com" },
    { order_number: "LRX-2", status: "paid", email: "other@example.com" },
  ];
});

describe("account data (synthetic)", () => {
  it("returns only the verified email's orders and no subscription or billing data", async () => {
    const out = await runWithStartContext(
      { contextAfterGlobalMiddlewares: { userId: "user-1" }, request: new Request("http://localhost") } as never,
      () => fns.getMyAccount_createServerFn_handler({ data: undefined, context: { userId: "user-1" } }),
    );
    expect(out.result).toEqual({ email: "verified@example.com", orders: [mocks.rows[0]] });
    expect(mocks.tables).toEqual(["orders"]);
    expect(mocks.columns).not.toMatch(/fuzerx|stripe/);
  });

  it("no longer exposes a billing portal function", () => {
    expect(fns.createPortalSession_createServerFn_handler).toBeUndefined();
  });
});
