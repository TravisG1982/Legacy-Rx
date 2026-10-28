import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static guard: nothing in the shipped sources may load or address GA4, GTM,
 * Meta Pixel or the Conversions API. A future, approved setup must update this
 * test deliberately.
 */

const ROOT = process.cwd();
const FORBIDDEN: [string, RegExp][] = [
  ["googletagmanager", /googletagmanager\.com/i],
  ["google-analytics", /google-analytics\.com|analytics\.google\.com/i],
  ["gtag loader", /gtag\/js|\bgtag\s*\(/i],
  ["Meta Pixel script", /connect\.facebook\.net|fbevents\.js/i],
  ["fbq call", /\bfbq\s*\(\s*["'`]|window\.fbq/],
  ["Meta Graph API", /graph\.facebook\.com/i],
  ["hardcoded GA4 ID", /\bG-[A-Z0-9]{8,12}\b/],
  ["hardcoded Meta dataset ID", /1260936169249076/],
  ["Meta/GA4 env read", /META_CAPI_TOKEN|META_PIXEL_ID|GA4_MEASUREMENT_ID/],
  ["other trackers", /clarity\.ms|hotjar|doubleclick\.net|klaviyo\.com\/onsite/i],
];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "node_modules" || name === ".git") continue;
      walk(full, out);
    } else if (/\.(tsx?|jsx?|css|html|json|mjs|cjs)$/.test(name) && name !== "routeTree.gen.ts") {
      out.push(full);
    }
  }
  return out;
}

describe("shipped sources contain no tracker loaders", () => {
  const files = [
    ...walk(join(ROOT, "src")),
    ...walk(join(ROOT, "public")),
    join(ROOT, "vite.config.ts"),
    join(ROOT, "vercel.json"),
    join(ROOT, "package.json"),
  ].filter((f) => !f.endsWith("no-third-party-trackers.test.ts") && !f.endsWith(".test.ts"));

  it("scans a non-trivial file set", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  for (const [label, pattern] of FORBIDDEN) {
    it(`has no ${label}`, () => {
      const hits = files
        .filter((f) => pattern.test(readFileSync(f, "utf8")))
        .map((f) => relative(ROOT, f).split(sep).join("/"));
      expect(hits).toEqual([]);
    });
  }
});
