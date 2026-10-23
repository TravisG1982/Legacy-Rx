import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AdminPricingRow, LivePrices } from "./pricing-types";

/** Public read: prices from the checked-in LegacyRX catalog, product_id -> price. */
export const getLivePrices = createServerFn({ method: "GET" }).handler(
  async (): Promise<LivePrices> => {
    const { fetchLivePrices } = await import("./pricing.server");
    const { PRICED_PRODUCT_IDS } = await import("./pricing-types");
    try {
      const { prices, source } = await fetchLivePrices();
      const scoped: Record<string, number> = {};
      for (const id of PRICED_PRODUCT_IDS) {
        const value = prices[id];
        if (typeof value === "number" && Number.isFinite(value)) scoped[id] = value;
      }
      return { ok: true, prices: scoped, source };
    } catch (error) {
      return { ok: false, prices: {}, error: (error as Error).message };
    }
  },
);

/** Gated: product list and display prices for the admin dashboard. */
export const adminListPricing = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchCatalog, fetchLivePrices } = await import("./pricing.server");
  const { requireAdminAccess, auditAdminAction } = await import("./admin-access.server");
  const { PRICED_PRODUCT_IDS } = await import("./pricing-types");
  const actor = await requireAdminAccess("view_pricing", "view_pricing", "pricing");

  try {
    const [catalog, live] = await Promise.all([fetchCatalog(), fetchLivePrices()]);
    const byId = new Map(catalog.map((row) => [row.productId, row]));
    const rows: AdminPricingRow[] = PRICED_PRODUCT_IDS.map((id) => {
      const item = byId.get(id);
      const price = live.prices[id];
      return {
        productId: id,
        name: item?.name ?? "",
        sku: item?.sku ?? "",
        price: typeof price === "number" ? price : (item?.price ?? null),
      };
    });
    await auditAdminAction(actor.userId, "view_pricing", "pricing", null, "success");
    return { authenticated: true as const, rows, error: null, source: live.source };
  } catch (error) {
    await auditAdminAction(actor.userId, "view_pricing", "pricing", null, "failure");
    return { authenticated: true as const, rows: [] as AdminPricingRow[], error: (error as Error).message };
  }
});

/** Historical update endpoint; price editing remains unavailable until an owned catalog exists. */
export const adminUpdatePricing = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { requireAdminAccess, auditAdminAction, validateAdminInput } = await import("./admin-access.server");
    const actor = await requireAdminAccess("view_pricing", "update_pricing", "pricing");
    const input = await validateAdminInput(actor.userId, "update_pricing", "pricing", data,
      (value) => z.object({ productId: z.string().regex(/^\d+$/), price: z.number().positive().max(100000) }).parse(value));
    await auditAdminAction(actor.userId, "update_pricing", "pricing", input.productId, "denied");
    return { ok: false as const, error: "Price editing is unavailable." };
  });
