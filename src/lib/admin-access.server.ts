import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { effectivePermissions, hasVerifiedTotp, type AdminPermission, type AdminRole } from "./admin-policy";

export type { AdminPermission, AdminRole } from "./admin-policy";
export type AdminAccess = { userId: string; role: AdminRole; permissions: Record<AdminPermission, boolean> };
export type AdminStatus = { state: "signed_out" | "forbidden" | "mfa_required" | "ready"; role?: AdminRole; permissions?: Record<AdminPermission, boolean> };

const empty: Record<AdminPermission, boolean> = {
  view_leads: false, delete_leads: false, view_pricing: false,
};

function bearerToken(): string | null {
  const header = getRequest()?.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token.split(".").length === 3 ? token : null;
}

/** No role or MFA decision is cached in a cookie or a JWT. */
export async function adminStatus(): Promise<AdminStatus & { userId?: string }> {
  const token = bearerToken();
  if (!token) return { state: "signed_out" };
  const [{ data: userData, error: userError }, { data: claimsData, error: claimsError }] = await Promise.all([
    supabaseAdmin.auth.getUser(token), supabaseAdmin.auth.getClaims(token),
  ]);
  const user = userData.user;
  if (userError || claimsError || !claimsData || !user || !user.email_confirmed_at || claimsData.claims?.sub !== user.id) {
    return { state: "signed_out" };
  }
  const { data: assignment, error } = await supabaseAdmin.from("admin_roles")
    .select("role, view_leads, delete_leads, view_pricing")
    .eq("user_id", user.id).maybeSingle();
  if (error) throw new Error("Could not check admin access.");
  if (!assignment) return { state: "forbidden", userId: user.id };
  const role = assignment.role as AdminRole;
  const permissions = effectivePermissions(role, {
    view_leads: assignment.view_leads, delete_leads: assignment.delete_leads,
    view_pricing: assignment.view_pricing,
  });
  const claims = claimsData!.claims as { aal?: string; amr?: Array<{ method?: string } | string> };
  if (!hasVerifiedTotp(claims)) {
    return { state: "mfa_required", userId: user.id, role, permissions };
  }
  const { data: factors, error: factorError } = await supabaseAdmin.auth.admin.mfa.listFactors({ userId: user.id });
  if (factorError) throw new Error("Could not verify admin MFA factor.");
  if (!factors.factors.some((factor) => factor.factor_type === "totp" && factor.status === "verified")) {
    return { state: "mfa_required", userId: user.id, role, permissions };
  }
  return { state: "ready", userId: user.id, role, permissions };
}

export type AdminAuditResult = "denied" | "success" | "failure" | "validation_error";

export async function auditAdminAction(actorId: string | null, action: string, objectType: string, objectId: string | null, result: AdminAuditResult) {
  // Anonymous callers can hit public server functions without a rate limit. Do not
  // let them fill the admin audit table with unauthenticated requests.
  if (!actorId) return;
  const { error } = await supabaseAdmin.from("admin_audit_log").insert({ actor_id: actorId, action, object_type: objectType, object_id: objectId, result });
  if (error) throw new Error("Could not record admin action.");
}

/** Parse only after authentication; record invalid requests without retaining their input. */
export async function validateAdminInput<T>(actorId: string, action: string, objectType: string, input: unknown, parse: (input: unknown) => T): Promise<T> {
  try {
    return parse(input);
  } catch {
    await auditAdminAction(actorId, action, objectType, null, "validation_error");
    throw new Error("Invalid admin request.");
  }
}

export async function requireAdminAccess(permission: AdminPermission, action: string, objectType: string, objectId: string | null = null): Promise<AdminAccess> {
  const status = await adminStatus();
  if (status.state !== "ready" || !status.permissions?.[permission] || !status.userId || !status.role) {
    await auditAdminAction(status.userId ?? null, action, objectType, objectId, "denied");
    throw new Error("Admin access requires an assigned role, permission, and verified TOTP factor.");
  }
  return { userId: status.userId, role: status.role, permissions: status.permissions ?? empty };
}
