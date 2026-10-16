import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AdminPricingRow, LivePrices } from "./pricing-types";

/** Public read: current LegacyRx (Site ID 533) prices, product_id -> price. */
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

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ username: z.string().max(200), password: z.string().max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { adminCredentialsMatch, adminSession } = await import("./pricing.server");
    if (!adminCredentialsMatch(data.username, data.password)) return { ok: false as const };
    const session = await adminSession();
    await session.update({ admin: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { adminSession } = await import("./pricing.server");
  const session = await adminSession();
  await session.clear();
  return { ok: true as const };
});

/** Gated: product list + live prices for the admin dashboard. */
export const adminListPricing = createServerFn({ method: "GET" }).handler(async () => {
  const { adminSession, fetchCatalog, fetchLivePrices } = await import("./pricing.server");
  const { PRICED_PRODUCT_IDS } = await import("./pricing-types");
  const session = await adminSession();
  if (!session.data.admin) {
    return { authenticated: false as const, rows: [] as AdminPricingRow[], error: null };
  }

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
    return { authenticated: true as const, rows, error: null, source: live.source };
  } catch (error) {
    return { authenticated: true as const, rows: [] as AdminPricingRow[], error: (error as Error).message };
  }
});

/** Gated: update a price, then re-read the GET API and verify persistence. */
export const adminUpdatePricing = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        productId: z.string().regex(/^\d+$/),
        price: z.number().positive().max(100000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { adminSession, fetchLivePrices, updateLivePrice } = await import("./pricing.server");
    const { PRICED_PRODUCT_IDS } = await import("./pricing-types");
    const session = await adminSession();
    if (!session.data.admin) return { ok: false as const, error: "Not authenticated." };
    if (!PRICED_PRODUCT_IDS.includes(data.productId)) {
      return { ok: false as const, error: "Unknown product ID." };
    }

    const priceString = data.price.toFixed(2);
    try {
      await updateLivePrice(data.productId, priceString);
    } catch (error) {
      return { ok: false as const, error: (error as Error).message };
    }

    // The GET API is the source of truth: verify the value actually persisted.
    try {
      const live = await fetchLivePrices();
      const persisted = live.prices[data.productId];
      if (typeof persisted !== "number") {
        return {
          ok: true as const,
          verified: false as const,
          error: "Update accepted, but the pricing API did not return this product.",
        };
      }
      if (Math.abs(persisted - Number(priceString)) > 0.001) {
        return {
          ok: true as const,
          verified: false as const,
          persisted,
          error: `Update accepted, but the pricing API still reports ${persisted.toFixed(2)}.`,
        };
      }
      return { ok: true as const, verified: true as const, persisted };
    } catch (error) {
      return { ok: true as const, verified: false as const, error: (error as Error).message };
    }
  });
