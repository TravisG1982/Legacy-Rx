import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * LegacyRx (Site ID 533) pricing integration.
 * All calls run server-side only; the browser never talks to WhiteLabelMD directly.
 */
export const LEGACYRX_SITE_ID = 533;
const API_BASE = "https://panel.whitelabelmd.com/legacyrx/api";
const GET_PRICES_URL = `${API_BASE}/get_product_prices`;
const GET_PRODUCTS_URL = `${API_BASE}/get_products`;
const UPDATE_PRICE_URL = `${API_BASE}/update-product-price`;

export type PriceMap = Record<string, number>;
export type CatalogRow = { productId: string; name: string; sku: string; price: number };

type PricesResult = { prices: PriceMap; source: "get_product_prices" | "get_products" };

/** Primary: LegacyRx get_product_prices. Falls back to LegacyRx get_products (same site). */
export async function fetchLivePrices(): Promise<PricesResult> {
  try {
    const res = await fetch(GET_PRICES_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ site_id: LEGACYRX_SITE_ID }),
    });
    if (res.ok) {
      const json = (await res.json()) as {
        status?: number;
        data?: { product_id?: string | number; product_price?: string | number }[];
      };
      if (json.status === 1 && Array.isArray(json.data)) {
        const prices: PriceMap = {};
        for (const row of json.data) {
          const id = String(row.product_id ?? "");
          const price = Number(row.product_price);
          if (id && Number.isFinite(price)) prices[id] = price;
        }
        if (Object.keys(prices).length > 0) return { prices, source: "get_product_prices" };
      }
    }
  } catch {
    // fall through to the products endpoint
  }

  const catalog = await fetchCatalog();
  const prices: PriceMap = {};
  for (const row of catalog) prices[row.productId] = row.price;
  if (Object.keys(prices).length === 0) throw new Error("LegacyRx pricing API is unavailable.");
  return { prices, source: "get_products" };
}

/** LegacyRx product catalog (product_id, name, sku, current price). */
export async function fetchCatalog(): Promise<CatalogRow[]> {
  const res = await fetch(GET_PRODUCTS_URL, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`LegacyRx product API returned ${res.status}`);
  const json = (await res.json()) as {
    product?: {
      product_id?: string | number;
      product_name?: string;
      product_sku?: string | null;
      product_price?: string | number;
    }[];
  };
  return (json.product ?? []).map((p) => ({
    productId: String(p.product_id ?? ""),
    name: p.product_name ?? "",
    sku: p.product_sku ?? "",
    price: Number(p.product_price),
  }));
}

export async function updateLivePrice(productId: string, price: string) {
  const res = await fetch(UPDATE_PRICE_URL, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ product_id: Number(productId), price }),
  });
  const text = await res.text();
  let json: { status?: number; message?: string; product_price?: string | number } = {};
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error("LegacyRx update API returned an unexpected response.");
  }
  if (!res.ok || json.status !== 1) {
    throw new Error(json.message || `LegacyRx update API returned ${res.status}`);
  }
  return { message: json.message ?? "Updated", price: Number(json.product_price) };
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
