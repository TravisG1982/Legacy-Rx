import { beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  header: null as string | null,
  user: { id: "00000000-0000-0000-0000-000000000001", email_confirmed_at: "2026-01-01" },
  assignment: null as null | { role: "owner" | "staff"; view_leads: boolean; delete_leads: boolean; view_pricing: boolean; manage_coupons: boolean },
  claims: { sub: "00000000-0000-0000-0000-000000000001", aal: "aal2", amr: [{ method: "totp" }] },
  factors: [{ factor_type: "totp", status: "verified" }],
  audit: [] as unknown[],
}));

vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => ({ headers: { get: () => fixture.header } }),
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    auth: {
      getUser: async () => ({ data: { user: fixture.user }, error: null }),
      getClaims: async () => ({ data: { claims: fixture.claims }, error: null }),
      admin: { mfa: { listFactors: async () => ({ data: { factors: fixture.factors }, error: null }) } },
    },
    from: (table: string) => table === "admin_roles" ? {
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: fixture.assignment, error: null }) }) }),
    } : {
      insert: async (row: unknown) => { fixture.audit.push(row); return { error: null }; },
    },
  },
}));

import { adminStatus, requireAdminAccess } from "./admin-access.server";

const staff = { role: "staff" as const, view_leads: true, delete_leads: false, view_pricing: false, manage_coupons: true };

beforeEach(() => {
  fixture.header = "Bearer one.two.three";
  fixture.assignment = staff;
  fixture.claims.aal = "aal2";
  fixture.claims.amr = [{ method: "totp" }];
  fixture.factors = [{ factor_type: "totp", status: "verified" }];
  fixture.audit.length = 0;
});

describe("server admin access", () => {
  it("denies guests and patients", async () => {
    fixture.header = null;
    expect((await adminStatus()).state).toBe("signed_out");
    fixture.header = "Bearer one.two.three";
    fixture.assignment = null;
    expect((await adminStatus()).state).toBe("forbidden");
  });
  it("requires TOTP assurance and a currently verified factor", async () => {
    fixture.claims.aal = "aal1";
    expect((await adminStatus()).state).toBe("mfa_required");
    fixture.claims.aal = "aal2";
    fixture.factors = [];
    expect((await adminStatus()).state).toBe("mfa_required");
  });
  it("uses current staff permissions and immediately sees revocation", async () => {
    expect((await adminStatus()).permissions).toMatchObject({ view_leads: true, delete_leads: false, view_pricing: false, manage_coupons: true });
    await expect(requireAdminAccess("delete_leads", "delete_leads", "funnel_leads")).rejects.toThrow();
    expect(fixture.audit).toHaveLength(1);
    fixture.assignment = null;
    expect((await adminStatus()).state).toBe("forbidden");
  });
  it("allows owner every existing permission", async () => {
    fixture.assignment = { ...staff, role: "owner", view_leads: false, manage_coupons: false };
    expect(Object.values((await adminStatus()).permissions ?? {})).toEqual([true, true, true, true]);
  });
});
