export type CouponResult = {
  valid: boolean;
  code?: string;
  type?: "percent" | "amount" | "fixed_total";
  value?: number;
  message?: string;
  source?: "api" | "test";
};

export const COUPON_API = "https://panel.whitelabelmd.com/wlmdbackend/api/check_coupons_v3";
export const COUPON_SITE_ID = "533";

/** Offline test codes so checkout can be exercised without a live coupon. */
export const TEST_COUPONS: Record<string, { type: "percent" | "fixed_total"; value: number }> = {};

/**
 * Resolves a campaign code (e.g. EXCLUSIVE from an offer link) offline so plan
 * cards and checkout can show the discount without a network round trip.
 */
export function resolveCampaignCoupon(code?: string | null): CouponResult | null {
  const trimmed = (code ?? "").trim();
  if (!trimmed) return null;
  const test = TEST_COUPONS[trimmed.toLowerCase()];
  if (!test) return null;
  return { valid: true, code: trimmed, type: test.type, value: test.value, source: "test" };
}

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : 0;
}

/** Normalises the WhiteLabelMD coupon response; null when the code is not valid. */
export function normaliseCoupon(code: string, body: Record<string, unknown>): CouponResult | null {
  const status = body['status'];
  const ok = status === 1 || status === "1" || status === true || body['success'] === true;
  if (!ok) return null;

  const raw = (body['data'] ?? body['coupon'] ?? body['result'] ?? body) as Record<string, unknown>;
  const rawType = String(
    raw['discount_type'] ?? raw['coupon_type'] ?? raw['type'] ?? "percentage",
  ).toLowerCase();
  const value = num(
    raw['discount'] ?? raw['discount_value'] ?? raw['amount'] ?? raw['coupon_value'] ?? raw['value'],
  );
  const isPercent = rawType.includes("percent") || rawType === "%" || rawType === "1";
  if (value <= 0) return null;

  return {
    valid: true,
    code,
    type: isPercent ? "percent" : "amount",
    value,
    message: String(body['message'] ?? "Coupon applied."),
    source: "api",
  };
}

/** The exact payload the coupon service expects. */
export function couponPayload(code: string, opts?: { productId?: string; email?: string }) {
  return {
    site_id: COUPON_SITE_ID,
    promo_codes: code,
    product_id: opts?.productId ?? "",
    email: opts?.email ?? "",
  };
}

/** Validates a promo code against the admin-managed coupon list. */
export async function checkCoupon(
  code: string,
  opts?: { med?: string; productId?: string; email?: string },
): Promise<CouponResult> {
  const trimmed = code.trim();
  if (!trimmed) return { valid: false, message: "Enter a promo code." };
  try {
    const res = await fetch("/api/check-coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: trimmed, med: opts?.med }),
    });
    return (await res.json()) as CouponResult;
  } catch {
    return { valid: false, message: "Could not verify that code right now." };
  }
}

/** Applies a validated coupon to a subtotal and returns the payable total. */
export function totalWithCoupon(subtotal: number, coupon: CouponResult | null): number {
  if (!coupon?.valid || !coupon.value) return subtotal;
  if (coupon.type === "percent") return Math.max(0, subtotal * (1 - coupon.value / 100));
  if (coupon.type === "fixed_total") return Math.max(0, coupon.value);
  return Math.max(0, subtotal - coupon.value);
}
