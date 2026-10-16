// FuseHealth Brand API (api.fusehealth.com/api/v1), authenticated with x-api-key.
// The live write-scoped key is stored in the FUZERX_API_KEY secret.

const BASE = "https://api.fusehealth.com/api/v1";

export async function fuseBrandFetch<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const key = process.env["FUZERX_API_KEY"];
  if (!key) throw new Error("FuseHealth API key is not configured");
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? "GET",
    headers: { "x-api-key": key, "Content-Type": "application/json", Accept: "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`FuseHealth ${path} failed [${res.status}]: ${text}`);
    throw new Error(`FuseHealth request failed [${res.status}]: ${text.slice(0, 300)}`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

/** Verifies `X-Fuse-Signature: t=<unix>,v1=<hex>` = HMAC-SHA256(secret, `${t}.${rawBody}`). */
export async function verifyFuseSignature(header: string | null, rawBody: string, secret: string): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.trim().split("=", 2) as [string, string]));
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 600) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${rawBody}`)));
  const hex = Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}
