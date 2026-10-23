export type CouponResult = {
  valid: boolean;
  code?: string;
  type?: "percent" | "amount" | "fixed_total";
  value?: number;
  message?: string;
  source?: "api" | "test";
};

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
