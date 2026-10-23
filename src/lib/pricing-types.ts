import { CHECKOUT_PRODUCT_IDS, MEDS, type MedKey, type Plan } from "./legacyrx-data";

/** The LegacyRx product IDs whose prices this project displays. */
export const PRICED_PRODUCT_IDS: string[] = Object.values(CHECKOUT_PRODUCT_IDS).flatMap((byPlan) =>
  Object.values(byPlan).filter((v): v is string => typeof v === "string"),
);

export type LivePrices = {
  ok: boolean;
  prices: Record<string, number>;
  source?: string;
  error?: string;
};

export type AdminPricingRow = {
  productId: string;
  name: string;
  sku: string;
  price: number | null;
};

export const PLAN_MONTHS: Record<Plan["id"], number> = { "1": 1, "3": 3, "6": 6, "12": 12 };

export type PlanPrice = { total: number; monthly: number; live: boolean };

/** Display price for a plan comes from the checked-in LegacyRX catalog. */
export function planPrice(
  prices: Record<string, number> | undefined,
  med: MedKey,
  planId: Plan["id"],
): PlanPrice {
  const productId = CHECKOUT_PRODUCT_IDS[med][planId] ?? "";
  // FuseHealth is merchant of record: the catalog mirrors its prices.
  void prices; void productId;
  const apiTotal: number | undefined = undefined;
  const fallback = MEDS[med].plans.find((p) => p.id === planId) ?? MEDS[med].plans[0]!;
  const total = typeof apiTotal === "number" && Number.isFinite(apiTotal) ? apiTotal : fallback.total;
  return { total, monthly: total / PLAN_MONTHS[fallback.id], live: typeof apiTotal === "number" };
}
