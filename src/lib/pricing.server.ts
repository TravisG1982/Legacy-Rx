import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { CHECKOUT_PRODUCT_IDS, MED_KEYS, MEDS } from "./legacyrx-data";

export type PriceMap = Record<string, number>;
export type CatalogRow = { productId: string; name: string; sku: string; price: number };

type PricesResult = { prices: PriceMap; source: "local_catalog" };

/** Display prices come from the checked-in LegacyRX catalog until an owned editor is built. */
export async function fetchLivePrices(): Promise<PricesResult> {
  const prices: PriceMap = {};
  for (const row of await fetchCatalog()) prices[row.productId] = row.price;
  return { prices, source: "local_catalog" };
}

/** Legacy product IDs are retained for historical rows; no retired vendor is queried. */
export async function fetchCatalog(): Promise<CatalogRow[]> {
  return MED_KEYS.flatMap((med) =>
    MEDS[med].plans.flatMap((plan) => {
      const productId = CHECKOUT_PRODUCT_IDS[med][plan.id];
      return productId
        ? [{ productId, name: `${MEDS[med].name} — ${plan.label}`, sku: med, price: plan.total }]
        : [];
    }),
  );
}

export async function updateLivePrice(_productId: string, _price: string): Promise<never> {
  throw new Error("Price editing is unavailable until a LegacyRX-controlled catalog is configured.");
}

/* ---------------- admin gate (isolated from customer auth) ---------------- */

export type AdminSession = { admin?: boolean };

export function adminSession() {
  return useSession<AdminSession>({
    password: process.env['SESSION_SECRET']!,
    name: "legacyrx-admin",
    maxAge: 60 * 60 * 12,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  });
}

function constantEquals(a: string, b: string) {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

export function adminCredentialsMatch(username: string, password: string) {
  const expectedUser = process.env['ADMIN_USERNAME'];
  const expectedPass = process.env['ADMIN_PASSWORD'];
  if (!expectedUser || !expectedPass) return false;
  return constantEquals(username, expectedUser) && constantEquals(password, expectedPass);
}
