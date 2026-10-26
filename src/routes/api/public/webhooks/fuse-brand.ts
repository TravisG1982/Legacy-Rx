// FuseHealth Brand API outbound webhook. Signed with X-Fuse-Signature
// (HMAC-SHA256 over `${t}.${rawBody}`) using FUSE_WEBHOOK_SECRET.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  id: z.string().optional(),
  event: z.string().max(80),
  data: z.record(z.string(), z.unknown()).default({}),
});

const STATUS: Record<string, string> = {
  "session.completed": "paid",
  "order.created": "paid",
  "payment.succeeded": "paid",
  "order.placed": "paid",
  "payment.failed": "payment_failed",
  "order.doctor_approved": "prescribed",
  "order.doctor_denied": "rejected",
  "order.sent_to_pharmacy": "order_processing",
  "order.shipped": "shipped",
  "shipment.updated": "shipped",
  "order.delivered": "delivered",
  "order.cancelled": "cancelled",
};

const s = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/api/public/webhooks/fuse-brand")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["FUSE_WEBHOOK_SECRET"];
        const raw = await request.text();
        const { verifyFuseSignature } = await import("@/lib/fuse-brand.server");
        if (!secret || !(await verifyFuseSignature(request.headers.get("x-fuse-signature"), raw, secret))) {
          return new Response("Invalid signature", { status: 401 });
        }
        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }
        const parsed = Body.safeParse(body);
        if (!parsed.success) return new Response("Bad payload", { status: 400 });
        const { event, data } = parsed.data;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const idem = request.headers.get("x-fuse-idempotency-key") ?? parsed.data.id;
        if (idem) {
          const { data: previous, error } = await supabaseAdmin
            .from("fuse_webhook_events")
            .select("idempotency_key")
            .eq("idempotency_key", idem)
            .maybeSingle();
          if (error) return new Response("Webhook storage unavailable", { status: 503 });
          if (previous) return Response.json({ received: true, duplicate: true });
        }

        const orderId = s(data["orderId"]) ?? s(data["order_id"]);
        const sessionId = s(data["sessionId"]) ?? s(data["session_id"]) ?? s(data["checkoutSessionId"]);
        if (!orderId && !sessionId) return new Response("Missing order identifier", { status: 400 });
        const eventLabel = STATUS[event] ? event : "unknown_event";
        const patch: Record<string, unknown> = { provider_last_event: `FuseHealth ${eventLabel}` };
        if (STATUS[event]) patch["status"] = STATUS[event];
        if (orderId) patch["fuse_order_id"] = orderId;
        const amount = Number(data["amount"] ?? data["total"]);
        if (Number.isFinite(amount) && amount > 0) {
          const dollars = amount > 5000 ? amount / 100 : amount;
          patch["total"] = dollars;
          patch["subtotal"] = dollars;
        }

        let q = null;
        if (orderId) q = await supabaseAdmin.from("orders").update(patch as never).eq("fuse_order_id", orderId).select("id");
        if (q?.error) {
          console.error("FuseHealth webhook order update failed.");
          return new Response("Order update unavailable", { status: 503 });
        }
        if ((!q || !q.data?.length) && sessionId) {
          q = await supabaseAdmin.from("orders").update(patch as never).eq("fuse_session_id", sessionId).select("id");
        }
        if (q?.error) {
          console.error("FuseHealth webhook order update failed.");
          return new Response("Order update unavailable", { status: 503 });
        }
        if (!q?.data?.length) {
          console.error("FuseHealth webhook has no matching order.");
          return new Response("Order not found yet", { status: 503 });
        }
        if (idem) {
          const { error } = await supabaseAdmin.from("fuse_webhook_events").insert({ idempotency_key: idem, event: eventLabel });
          if (error?.code === "23505") return Response.json({ received: true, duplicate: true });
          if (error) {
            console.error("FuseHealth webhook deduplication failed.");
            return new Response("Webhook storage unavailable", { status: 503 });
          }
        }
        return Response.json({ received: true });
      },
    },
  },
});
