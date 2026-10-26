import { describe, expect, it } from "vitest";
import { effectivePermissions, hasVerifiedTotp, type PermissionFlags } from "./admin-policy";

const none: PermissionFlags = { view_leads: false, delete_leads: false, view_pricing: false };

describe("admin policy", () => {
  it("grants every existing permission to owner", () => {
    expect(Object.values(effectivePermissions("owner", none))).toEqual([true, true, true]);
  });
  it("gives staff only explicitly assigned permissions", () => {
    expect(effectivePermissions("staff", none)).toEqual(none);
    expect(effectivePermissions("staff", { ...none, view_leads: true })).toEqual({ ...none, view_leads: true });
  });
  it("requires aal2 from a TOTP factor", () => {
    expect(hasVerifiedTotp({ aal: "aal1", amr: [{ method: "totp" }] })).toBe(false);
    expect(hasVerifiedTotp({ aal: "aal2", amr: [{ method: "otp" }] })).toBe(false);
    expect(hasVerifiedTotp({ aal: "aal2", amr: [{ method: "totp" }] })).toBe(true);
    expect(hasVerifiedTotp({ aal: "aal2", amr: ["totp"] })).toBe(true);
  });
});
