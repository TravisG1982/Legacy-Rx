import { beforeEach, describe, expect, it, vi } from "vitest";
import { runWithStartContext } from "@tanstack/start-storage-context";

const fixture = vi.hoisted(() => ({
  userId: "00000000-0000-0000-0000-000000000001",
  header: null as string | null,
  role: null as null | { role: "owner" | "staff"; view_leads: boolean; delete_leads: boolean; view_pricing: boolean },
  aal: "aal2",
  factors: [{ factor_type: "totp", status: "verified" }],
  audit: [] as Array<{ action: string; object_id?: string | null; result: string; actor_id?: string | null }>,
  deleted: [] as string[],
  deleteError: false,
}));
const actorId = fixture.userId;
const leadId = "00000000-0000-0000-0000-000000000002";
const none = { role: "staff" as const, view_leads: false, delete_leads: false, view_pricing: false };

vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => ({ headers: { get: () => fixture.header } }),
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    auth: {
      getUser: async () => ({ data: { user: { id: fixture.userId, email_confirmed_at: "2026-01-01" } }, error: null }),
      getClaims: async () => ({ data: { claims: { sub: fixture.userId, aal: fixture.aal, amr: [{ method: "totp" }] } }, error: null }),
      admin: { mfa: { listFactors: async () => ({ data: { factors: fixture.factors }, error: null }) } },
    },
    from: (table: string) => {
      if (table === "admin_roles") return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: fixture.role, error: null }) }) }) };
      if (table === "admin_audit_log") return { insert: async (row: typeof fixture.audit[number]) => { fixture.audit.push(row); return { error: null }; } };
      if (table === "funnel_leads") return { select: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }) };
      if (table === "orders") return { select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }) }) };
      throw new Error(`Unexpected table ${table}`);
    },
    rpc: async (name: string, args: { p_actor_id: string; p_lead_ids?: string[] }) => {
      if (name === "delete_admin_funnel_leads") {
        if (fixture.deleteError) return { data: null, error: { code: "XX000" } };
        fixture.deleted.push(...args.p_lead_ids!);
        for (const id of args.p_lead_ids!) fixture.audit.push({ actor_id: args.p_actor_id, action: "delete_leads", object_id: id, result: "success" });
        return { data: args.p_lead_ids!.length, error: null };
      }
      throw new Error("Unexpected RPC");
    },
  },
}));
vi.mock("./orders.server", () => ({ sweepAbandonedOrders: async () => {} }));

// Import the generated server handler exports so tests execute TanStack's validator and handler,
// rather than the client RPC proxy (which needs a running HTTP server).
// @ts-expect-error Vite's virtual server-function module has no TypeScript declaration.
import * as accessFns from "./admin-access.functions.ts?tss-serverfn-split";
// @ts-expect-error Vite virtual module.
import * as leadFns from "./leads.functions.ts?tss-serverfn-split";
// @ts-expect-error Vite virtual module.
import * as priceFns from "./pricing.functions.ts?tss-serverfn-split";

const handlers = {
  getAdminStatus: accessFns.getAdminStatus_createServerFn_handler,
  listFunnelLeads: leadFns.listFunnelLeads_createServerFn_handler,
  authorizeLeadExport: leadFns.authorizeLeadExport_createServerFn_handler,
  deleteFunnelLeads: leadFns.deleteFunnelLeads_createServerFn_handler,
  adminListPricing: priceFns.adminListPricing_createServerFn_handler,
  adminUpdatePricing: priceFns.adminUpdatePricing_createServerFn_handler,
};

const payloads: Record<keyof typeof handlers, unknown> = {
  getAdminStatus: undefined, listFunnelLeads: {}, authorizeLeadExport: undefined, deleteFunnelLeads: { ids: [leadId] },
  adminListPricing: undefined, adminUpdatePricing: { productId: "1", price: 10 },
};

async function call(name: keyof typeof handlers, data = payloads[name], token = true, oldCookie = false) {
  const headers = new Headers();
  if (token) headers.set("Authorization", "Bearer one.two.three");
  if (oldCookie) headers.set("Cookie", "legacyrx-admin=old; travis-gate=old");
  fixture.header = headers.get("Authorization");
  return runWithStartContext({ contextAfterGlobalMiddlewares: {}, request: new Request("http://localhost", { headers }) } as never,
    () => handlers[name]({ data }));
}
function outcome(result: { result?: unknown; error?: Error }): any {
  if (result.error) throw result.error;
  return result.result;
}

beforeEach(() => {
  fixture.role = { role: "owner", view_leads: false, delete_leads: false, view_pricing: false };
  fixture.aal = "aal2";
  fixture.factors = [{ factor_type: "totp", status: "verified" }];
  fixture.audit.length = 0;
  fixture.deleted.length = 0;
  fixture.deleteError = false;
});

describe("direct admin server functions", () => {
  it.each(Object.keys(handlers) as Array<keyof typeof handlers>)("denies guest %s even with old password cookies", async (name) => {
    const res = await call(name, payloads[name], false, true);
    if (name === "getAdminStatus") expect(outcome(res).state).toBe("signed_out");
    else expect(res.error).toBeTruthy();
    expect(fixture.audit).toEqual([]);
    expect(fixture.deleted).toEqual([]);
  });

  it.each(Object.keys(handlers) as Array<keyof typeof handlers>)("denies patient %s", async (name) => {
    fixture.role = null;
    const res = await call(name);
    if (name === "getAdminStatus") expect(outcome(res).state).toBe("forbidden");
    else expect(res.error).toBeTruthy();
    expect(fixture.audit.at(-1)?.result).toBe("denied");
  });

  it("checks staff permissions separately for reads, deletion, and pricing", async () => {
    fixture.role = { ...none, view_leads: true };
    expect(outcome(await call("listFunnelLeads")).leads).toEqual([]);
    expect(outcome(await call("authorizeLeadExport")).ok).toBe(true);
    expect(fixture.audit.at(-1)?.action).toBe("export_leads");
    expect((await call("deleteFunnelLeads")).error).toBeTruthy();
    expect((await call("adminListPricing")).error).toBeTruthy();
    fixture.role = { ...none, delete_leads: true, view_pricing: true };
    expect((await call("authorizeLeadExport")).error).toBeTruthy();
    expect(outcome(await call("deleteFunnelLeads")).deleted).toBe(1);
    expect(outcome(await call("adminListPricing")).authenticated).toBe(true);
    expect(outcome(await call("adminUpdatePricing")).ok).toBe(false);
  });

  it("allows owner with TOTP, then denies the next request after role revocation", async () => {
    expect(outcome(await call("getAdminStatus")).state).toBe("ready");
    expect(outcome(await call("deleteFunnelLeads")).deleted).toBe(1);
    expect(fixture.audit.find((entry) => entry.action === "delete_leads" && entry.result === "success")?.object_id).toBe(leadId);
    fixture.role = null;
    expect((await call("deleteFunnelLeads")).error).toBeTruthy();
    expect(fixture.deleted).toEqual([leadId]);
  });

  it("records every deleted lead UUID and logs an RPC failure without a deletion", async () => {
    const secondLeadId = "00000000-0000-0000-0000-000000000004";
    expect(outcome(await call("deleteFunnelLeads", { ids: [leadId, secondLeadId] })).deleted).toBe(2);
    expect(fixture.audit.filter((entry) => entry.action === "delete_leads" && entry.result === "success").map((entry) => entry.object_id)).toEqual([leadId, secondLeadId]);
    fixture.deleteError = true;
    expect((await call("deleteFunnelLeads")).error).toBeTruthy();
    expect(fixture.audit.at(-1)?.result).toBe("failure");
    expect(fixture.deleted).toEqual([leadId, secondLeadId]);
  });

  it("denies every function without confirmed TOTP", async () => {
    fixture.aal = "aal1";
    for (const name of Object.keys(handlers) as Array<keyof typeof handlers>) {
      const res = await call(name);
      if (name === "getAdminStatus") expect(outcome(res).state).toBe("mfa_required");
      else expect(res.error).toBeTruthy();
    }
    expect(fixture.deleted).toEqual([]);
  });

  it("denies a stale aal2 token after its TOTP factor is removed", async () => {
    fixture.factors = [];
    expect(outcome(await call("getAdminStatus")).state).toBe("mfa_required");
    expect((await call("listFunnelLeads")).error).toBeTruthy();
    expect(fixture.audit.at(-1)?.result).toBe("denied");
  });

  it("logs validation errors without raw input and prevents mutations", async () => {
    for (const [name, data] of [
      ["listFunnelLeads", { t: "bad-token-like-input" }],
      ["deleteFunnelLeads", { ids: ["patient@example.test"] }],
      ["adminUpdatePricing", { productId: "not-an-id", price: -1 }],
    ] as const) expect((await call(name, data)).error).toBeTruthy();
    expect(fixture.audit.filter((entry) => entry.result === "validation_error")).toHaveLength(3);
    expect(JSON.stringify(fixture.audit)).not.toMatch(/patient@example|bad-token-like-input/);
    expect(fixture.deleted).toEqual([]);
  });
});
