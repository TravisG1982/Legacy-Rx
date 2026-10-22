import { createFileRoute } from "@tanstack/react-router";
import { CONSENT_COOKIE } from "@/lib/analytics-consent";

/**
 * Meta Conversions API relay.
 *
 * Server-side so the access token never ships to the browser, and so Meta gets
 * a hit even when the Pixel is blocked. The handler re-validates and STRIPS the
 * incoming body: only an explicit allow-list of anonymized fields is forwarded,
 * so no medication, plan, name, email or phone can reach Meta even if client
 * code regresses.
 */

const GRAPH_VERSION = "v21.0";
const FALLBACK_DATASET_ID = "1260936169249076";

const ALLOWED_EVENTS = new Set(["PageView"]);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function clientIp(request: Request): string {
  const candidates = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-forwarded-for")?.split(",")[0],
  ];
  for (const c of candidates) {
    const ip = c?.trim();
    if (ip) return ip;
  }
  return "";
}

function str(value: unknown, max = 512): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

export const Route = createFileRoute("/api/public/meta-capi")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        const consent = request.headers
          .get("cookie")
          ?.split(";")
          .some((part) => part.trim() === `${CONSENT_COOKIE}=accepted`);
        if (!consent) return json({ ok: false, error: "Analytics consent required" }, 403);
        const token = process.env["META_CAPI_TOKEN"];
        const datasetId = process.env["META_PIXEL_ID"] || FALLBACK_DATASET_ID;
        if (!token) {
          return json({ ok: false, error: "Server not configured" }, 500);
        }

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ ok: false, error: "Invalid JSON" }, 400);
        }

        const eventName = str(body["event_name"], 64);
        if (!ALLOWED_EVENTS.has(eventName)) {
          return json({ ok: false, error: "Unsupported event_name" }, 400);
        }

        const incomingUser = (body["user_data"] ?? {}) as Record<string, unknown>;
        const externalId = str(incomingUser["external_id"], 128);

        const user_data: Record<string, unknown> = {
          client_user_agent:
            str(incomingUser["client_user_agent"], 512) ||
            str(request.headers.get("user-agent"), 512),
        };
        const ip = clientIp(request);
        if (ip) user_data["client_ip_address"] = ip;

        const fbp = str(incomingUser["fbp"], 128);
        if (fbp) user_data["fbp"] = fbp;
        // fbc must reach Meta byte-for-byte: never lowercase it, and never
        // slice it mid-value. A missing fbc costs less than a corrupted one, so
        // an implausibly long value is dropped rather than truncated.
        const rawFbc = incomingUser["fbc"];
        const fbc = typeof rawFbc === "string" && rawFbc.length <= 1024 ? rawFbc : "";
        if (fbc) user_data["fbc"] = fbc;

        if (externalId) user_data["external_id"] = await sha256Hex(externalId);

        // Data freshness: trust the browser's own event_time when it is sane
        // (inside Meta's 7-day window, not meaningfully in the future).
        const now = Math.floor(Date.now() / 1000);
        const rawTime = body["event_time"];
        const clientTime =
          typeof rawTime === "number" && Number.isFinite(rawTime) ? Math.floor(rawTime) : null;
        const eventTime =
          clientTime !== null && clientTime <= now + 60 && clientTime >= now - 7 * 24 * 60 * 60
            ? clientTime
            : now;

        const event: Record<string, unknown> = {
          event_name: eventName,
          event_time: eventTime,
          action_source: "website",
          user_data,
        };
        const eventId = str(body["event_id"], 128);
        if (eventId) event["event_id"] = eventId;
        event["event_source_url"] = `${new URL(request.url).origin}/`;

        const payload: Record<string, unknown> = { data: [event] };
        const testEventCode = str(body["test_event_code"], 64);
        if (testEventCode) payload["test_event_code"] = testEventCode;

        try {
          const res = await fetch(
            `https://graph.facebook.com/${GRAPH_VERSION}/${datasetId}/events?access_token=${encodeURIComponent(token)}`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            },
          );
          const text = await res.text();
          if (!res.ok) {
            console.error(`Meta CAPI failed [${res.status}]: ${text}`);
            return json({ ok: false, status: res.status, meta: text }, 502);
          }
          let meta: unknown = text;
          try {
            meta = JSON.parse(text);
          } catch {
            // keep raw text
          }
          // Temporary delivery trail: lets us confirm from server logs which
          // events Meta actually accepted, without inferring from the browser.
          const received =
            typeof meta === "object" && meta !== null
              ? (meta as { events_received?: number }).events_received
              : undefined;
          const trace =
            typeof meta === "object" && meta !== null
              ? (meta as { fbtrace_id?: string }).fbtrace_id
              : undefined;
          console.log(
            `Meta CAPI ok event=${eventName} dataset=${datasetId} received=${received ?? "?"} trace=${trace ?? "?"} test_code=${testEventCode || "none"}`,
          );
          return json({ ok: true, meta }, 200);
        } catch (err) {
          console.error("Meta CAPI request error", err);
          return json({ ok: false, error: "Upstream request failed" }, 502);
        }
      },
    },
  },
});
