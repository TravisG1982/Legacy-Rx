import { MED_KEYS } from "./legacyrx-data";
// src/lib/coupons-admin.functions.ts — admin CRUD for discount codes.
// Gated by the same admin session as the pricing portal.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function requireAdmin() {
  const { adminSession } = await import("./pricing.server");
  const session = await adminSession();
  if (!session.data.admin) throw new Error("Not signed in to admin.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
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
  const db = await requireAdmin();
  const { data, error } = await db.from("coupons").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminCoupon[];
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
});

export const adminSaveCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CouponInput.parse(d))
  .handler(async ({ data }) => {
    if (data.type === "percent" && data.amount > 100) throw new Error("Percent can't be over 100.");
    const db = await requireAdmin();
    const { id, ...row } = data;
    const res = id ? await db.from("coupons").update(row).eq("id", id) : await db.from("coupons").insert(row);
    if (res.error) throw new Error(res.error.code === "23505" ? "That code already exists." : res.error.message);
    return { ok: true };
  });

export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const db = await requireAdmin();
    const { error } = await db.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
