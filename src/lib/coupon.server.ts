// src/lib/coupon.server.ts — authoritative coupon validation against the
// admin-managed coupons table. The payment session is always priced from this
// server-side result, never from client totals.
import { totalWithCoupon, type CouponResult } from "./coupon";

type CouponRow = {
  code: string;
  type: "percent" | "fixed" | "fixed_total";
  amount: number;
  active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
  meds: string[];
};

export async function validateCouponServer(
  code: string | null | undefined,
  opts?: { med?: string; productId?: string; email?: string },
): Promise<CouponResult | null> {
  const r = await checkCouponServer(code, opts);
  return r.valid ? r : null;
}

export async function checkCouponServer(
  code: string | null | undefined,
  opts?: { med?: string },
): Promise<CouponResult> {
  const trimmed = (code ?? "").trim();
  if (!trimmed) return { valid: false, message: "Enter a promo code." };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("coupons")
    .select("code,type,amount,active,expires_at,max_uses,uses,meds")
    .ilike("code", trimmed.replace(/[%_\\]/g, "\\$&"))
    .maybeSingle();
  const row = data as CouponRow | null;
  const bad = (message: string): CouponResult => ({ valid: false, code: trimmed, message });
  if (!row || !row.active) return bad("That code isn't valid.");
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return bad("That code has expired.");
  if (row.max_uses != null && row.uses >= row.max_uses) return bad("That code has reached its limit.");
  if (opts?.med && row.meds?.length && !row.meds.includes(opts.med)) return bad("That code doesn't apply to this medication.");
  return {
    valid: true,
    code: row.code,
    type: row.type === "fixed" ? "amount" : row.type,
    value: Number(row.amount),
    message: "Coupon applied.",
    source: "api",
  };
}

export async function redeemCoupon(code: string | null | undefined) {
  if (!code) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.rpc("redeem_coupon", { _code: code });
}

export { totalWithCoupon };
