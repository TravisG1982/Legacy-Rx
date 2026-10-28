import { createFileRoute } from "@tanstack/react-router";

/**
 * Meta Conversions API relay: DISABLED.
 *
 * Client decision: no Meta traffic of any kind until a separately approved,
 * healthcare-privacy-safe setup exists. This route therefore never reads the
 * request body, cookies, headers or environment variables (token, dataset ID,
 * consent cookie), never calls Meta, and never logs a request. It answers every
 * POST with a fixed 410 regardless of configuration or consent.
 *
 * The earlier forwarding code was removed rather than gated so a stray
 * environment variable cannot revive it. Re-enabling is a separate, quoted task.
 */
export const Route = createFileRoute("/api/public/meta-capi")({
  server: {
    handlers: {
      POST: async () =>
        new Response(JSON.stringify({ ok: false, error: "Analytics is disabled" }), {
          status: 410,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        }),
    },
  },
});
