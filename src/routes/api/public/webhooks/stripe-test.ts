// Stripe TEST-mode webhook for the LegacyRX test payment path. Verified against the raw
// request body with STRIPE_TEST_WEBHOOK_SECRET. Never touches FuseHealth orders.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/stripe-test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { stripeTestEnabled, requireStripeTest, effectOf } = await import("@/lib/stripe-test.server");
        const secret = process.env["STRIPE_TEST_WEBHOOK_SECRET"];
        if (!stripeTestEnabled() || !secret) return new Response("Not found", { status: 404 });

        // The signature covers the exact bytes received, so read the body once as text.
        const raw = await request.text();
        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Invalid signature", { status: 400 });

        let event;
        try {
          event = requireStripeTest().webhooks.constructEvent(raw, signature, secret);
        } catch {
          return new Response("Invalid signature", { status: 400 });
        }
        if (event.livemode) return new Response("Live events are not accepted", { status: 400 });

        const effect = effectOf(event);
        if (!effect) return Response.json({ received: true, ignored: true });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("apply_payment_test_event", {
          p_event_id: event.id,
          p_event_type: event.type,
          p_order_id: effect.orderId,
          p_session_id: effect.sessionId,
          p_payment_intent_id: effect.paymentIntentId,
          p_target_status: effect.target,
          p_amount_cents: effect.amountCents,
          p_currency: effect.currency,
        } as never);
        if (error) {
          // Unknown order or storage trouble: the event id was not recorded, so ask Stripe to retry.
          console.error("Stripe test webhook could not be applied.");
          return new Response("Order update unavailable", { status: 503 });
        }
        return Response.json({ received: true, result: data });
      },
    },
  },
});
