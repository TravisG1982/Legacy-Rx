export type AdminPermission = "view_leads" | "delete_leads" | "view_pricing" | "manage_coupons";
export type AdminRole = "owner" | "staff";
export type PermissionFlags = Record<AdminPermission, boolean>;

export function effectivePermissions(role: AdminRole, flags: PermissionFlags): PermissionFlags {
  return role === "owner"
    ? { view_leads: true, delete_leads: true, view_pricing: true, manage_coupons: true }
    : { ...flags };
}

export function hasVerifiedTotp(claims: { aal?: string; amr?: Array<{ method?: string } | string> }): boolean {
  return claims.aal === "aal2" && Boolean(claims.amr?.some((item) => (typeof item === "string" ? item : item.method) === "totp"));
}
