import { MED_KEYS } from "./legacyrx-data";
// src/lib/coupons-admin.functions.ts — admin CRUD for discount codes.
// Every endpoint checks the caller's current role, permission and TOTP assurance.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function requireAdmin(action: string, objectId: string | null = null) {
  const { requireAdminAccess } = await import("./admin-access.server");
  const actor = await requireAdminAccess("manage_coupons", action, "coupon", objectId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return { db: supabaseAdmin, actor };
}

export type AdminCoupon = {
  id: string;
  code: string;
  type: "percent" | "fixed" | "fixed_total";
  amount: number;
  active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
  meds: string[];
};

export const adminListCoupons = createServerFn({ method: "GET" }).handler(async () => {
  const { db, actor } = await requireAdmin("list_coupons");
  const { auditAdminAction } = await import("./admin-access.server");
  try {
    const { data, error } = await db.from("coupons").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    await auditAdminAction(actor.userId, "list_coupons", "coupon", null, "success");
    return (data ?? []) as AdminCoupon[];
  } catch (error) {
    await auditAdminAction(actor.userId, "list_coupons", "coupon", null, "failure");
    throw error;
  }
});

const CouponInput = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - and _ only"),
  type: z.enum(["percent", "fixed", "fixed_total"]),
  amount: z.number().min(0).max(100000),
  active: z.boolean(),
  expires_at: z.string().nullable(),
  max_uses: z.number().int().positive().nullable(),
  meds: z.array(z.enum(MED_KEYS)).min(1),
}).refine((value) => value.type !== "percent" || value.amount <= 100);

export const adminSaveCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d)
  .handler(async ({ data }) => {
    const { db, actor } = await requireAdmin("save_coupon");
    const { auditAdminAction, validateAdminInput } = await import("./admin-access.server");
    const input = await validateAdminInput(actor.userId, "save_coupon", "coupon", data, (value) => CouponInput.parse(value));
    const { id, ...row } = input;
    try {
      const res = await db.rpc("save_admin_coupon", {
        p_actor_id: actor.userId,
        p_coupon_id: id ?? null,
        p_code: row.code,
        p_type: row.type,
        p_amount: row.amount,
        p_active: row.active,
        p_expires_at: row.expires_at,
        p_max_uses: row.max_uses,
        p_meds: row.meds,
      });
      if (res.error) throw new Error(res.error.code === "23505" ? "That code already exists." : "Could not save coupon.");
    } catch (error) {
      await auditAdminAction(actor.userId, "save_coupon", "coupon", id ?? null, "failure");
      throw error;
    }
    return { ok: true };
  });

export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d)
  .handler(async ({ data }) => {
    const { db, actor } = await requireAdmin("delete_coupon");
    const { auditAdminAction, validateAdminInput } = await import("./admin-access.server");
    const input = await validateAdminInput(actor.userId, "delete_coupon", "coupon", data,
      (value) => z.object({ id: z.string().uuid() }).parse(value));
    try {
      const { error } = await db.rpc("delete_admin_coupon", {
        p_actor_id: actor.userId,
        p_coupon_id: input.id,
      });
      if (error) throw new Error("Could not delete coupon.");
    } catch (error) {
      await auditAdminAction(actor.userId, "delete_coupon", "coupon", input.id, "failure");
      throw error;
    }
    return { ok: true };
  });
