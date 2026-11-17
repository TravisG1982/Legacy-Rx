import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/beluga")({
  server: {
    handlers: {
      ANY: async ({ request }) => {
        const { receiveBelugaWebhook } = await import("@/lib/beluga-webhook.server");
        return receiveBelugaWebhook(request);
      },
    },
  },
});
