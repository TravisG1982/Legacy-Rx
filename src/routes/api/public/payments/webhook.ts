// src/routes/api/public/payments/webhook.ts — built-in payments webhook.
// Verifies the signature on every request, marks the order paid, and starts
// the FuzeRx intake. Never called by app code — external caller only.
import { createFileRoute } from "@tanstack/react-router";
import type { OrderRow } from "@/lib/fulfill.server";
import type { StripeEnv } from "@/lib/stripe.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySession = any;

async function markOrderPaid(session: AnySession, env: StripeEnv, order: OrderRow | null): Promise<OrderRow | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { createStripeClient } = await import("@/lib/stripe.server");
  const { startFulfillment } = await import("@/lib/fulfill.server");

  if (!order) return null;

  // Guard the amount: the charged total must match the order total.
  const paid = Number(session.amount_total ?? 0) / 100;
  if (Number.isFinite(paid) && Math.abs(paid - Number(order.total)) > 0.01) {
    console.error("Webhook amount mismatch.");
    await supabaseAdmin
      .from("orders")
      .update({
        fuzerx_last_event: `Amount mismatch: charged ${paid.toFixed(2)} vs order ${order.total}`,
        fuzerx_status: "amount_mismatch",
      })
      .eq("id", order.id);
    return null;
  }

  let cardLast4 = order.card_last4;
  const subscriptionId: string | null =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
  try {
    const stripe = createStripeClient(env);
    let pmId: string | undefined;
    if (session.payment_intent) {
      const pi = await stripe.paymentIntents.retrieve(session.payment_intent);
      pmId = typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method?.id;
    } else if (subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const { upsertSubscription } = await import("@/lib/orders.server");
      await upsertSubscription(sub, env);
      pmId = typeof sub.default_payment_method === "string" ? sub.default_payment_method : sub.default_payment_method?.id;
    }
    if (pmId) {
      const pm = await stripe.paymentMethods.retrieve(pmId);
      if (pm.card?.last4) cardLast4 = pm.card.last4;
    }
  } catch {
    console.error("Card/subscription lookup failed.");
  }

  if (order.status === "paid") return order; // already finalized (webhook retry)

  const { data: updated } = await supabaseAdmin
    .from("orders")
    .update({
      status: "paid",
      stripe_payment_intent_id: session.payment_intent ?? null,
      stripe_subscription_id: subscriptionId,
      stripe_invoice_id: typeof session.invoice === "string" ? session.invoice : session.invoice?.id ?? null,
      card_last4: cardLast4,
      fuzerx_status: "paid",
      fuzerx_last_event: "Payment captured",
    } as never)
    .eq("id", order.id)
    .select("*")
    .single();
  const { redeemCoupon } = await import("@/lib/coupon.server");
  await redeemCoupon(order.coupon_code).catch(() => {});

  const paidOrder = (updated as OrderRow) ?? { ...order, status: "paid" };
  // Fulfill after payment. Never block the webhook response on fulfillment
  // errors — startFulfillment records its own failures.
  try {
    const md = (session as { metadata?: Record<string, string> | null }).metadata ?? {};
    await startFulfillment(paidOrder, { onGlp1: md.onGlp1 || null, conditions: md.conditions || null });
  } catch {
    console.error("Fulfillment start failed.");
  }
  return paidOrder;
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const body = await req.text();
  const { verifyWebhook } = await import("@/lib/stripe.server");
  const secret = env === "sandbox"
    ? process.env.PAYMENTS_SANDBOX_WEBHOOK_SECRET
    : process.env.PAYMENTS_LIVE_WEBHOOK_SECRET;
  if (!secret) throw new Error(`${env} webhook secret is not configured`);
  if (!verifyWebhook(body, req.headers.get("stripe-signature"), secret)) {
    throw new Error("Invalid webhook signature");
  }
  const event = JSON.parse(body) as { type: string; data: { object: AnySession } };
  const { getOrderByStripeSession } = await import("@/lib/fulfill.server");

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.payment_status === "unpaid") {
        // Delayed-payment methods settle later via async_payment_succeeded.
        break;
      }
      const order = await getOrderByStripeSession(session.id);
      await markOrderPaid(session, env, order);
      break;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { logOrderFailureByStripeSession } = await import("@/lib/fulfill.server");
      const order = await getOrderByStripeSession(session.id);
      if (order) {
        await supabaseAdmin
          .from("orders")
          .update({ status: "payment_failed", fuzerx_last_event: "Delayed payment failed" })
          .eq("id", order.id);
        await logOrderFailureByStripeSession(order, "Delayed payment failed after checkout (async_payment_failed)");
      }
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (charge.payment_intent) {
        await supabaseAdmin
          .from("orders")
          .update({ fuzerx_last_event: "Payment refunded", status: "refunded" })
          .eq("stripe_payment_intent_id", charge.payment_intent);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const { upsertSubscription } = await import("@/lib/orders.server");
      const sub = event.data.object;
      await upsertSubscription(event.type === "customer.subscription.deleted" ? { ...sub, status: "canceled" } : sub, env);
      break;
    }
    case "invoice.paid": {
      const inv = event.data.object;
      if (inv.billing_reason !== "subscription_cycle") break; // first invoice handled by checkout
      await recordRenewal(inv, env);
      break;
    }
    case "invoice.payment_failed": {
      const inv = event.data.object;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("order_failures").insert({
        email: inv.customer_email ?? null,
        amount: Number(inv.amount_due ?? 0) / 100,
        reason: `Monthly renewal payment failed (invoice ${inv.id}). The payment provider will retry automatically.`,
      });
      break;
    }
    default:
      console.log("Unhandled payment event type.");
  }
}

function invoiceSubscriptionId(inv: AnySession): string | null {
  const s = inv.parent?.subscription_details?.subscription ?? inv.subscription;
  return typeof s === "string" ? s : s?.id ?? null;
}

/** Each monthly renewal becomes its own paid order and is sent for fulfillment. */
async function recordRenewal(inv: AnySession, env: StripeEnv) {
  const subId = invoiceSubscriptionId(inv);
  if (!subId) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing } = await supabaseAdmin.from("orders").select("id").eq("stripe_invoice_id", inv.id).maybeSingle();
  if (existing) return;
  const { data: first } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("stripe_subscription_id", subId)
    .eq("is_renewal", false)
    .maybeSingle();
  if (!first) {
    console.error("Renewal for unknown subscription.");
    return;
  }
  const { productFor } = await import("@/lib/legacyrx-data");
  const med = first.medication as import("@/lib/legacyrx-data").MedKey;
  const product = productFor(med, "1");
  const total = Number(inv.amount_paid ?? 0) / 100;
  const { id: _id, created_at: _c, ...rest } = first;
  const { data: renewal } = await supabaseAdmin
    .from("orders")
    .insert({
      ...rest,
      order_number: `LRX-R${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`,
      plan_id: "1",
      product_id: product.productId,
      product_name: `${product.name} (monthly renewal)`,
      subtotal: total,
      discount: 0,
      total,
      coupon_code: null,
      status: "paid",
      is_renewal: true,
      stripe_invoice_id: inv.id,
      stripe_session_id: null,
      stripe_payment_intent_id: null,
      environment: env,
      fuzerx_consult_id: null,
      fuzerx_fill_request_id: null,
      fuzerx_prescription_token: null,
      fuzerx_status: "paid",
      fuzerx_last_event: "Renewal payment captured",
    } as never)
    .select("*")
    .single();
  if (!renewal) return;
  const { startFulfillment } = await import("@/lib/fulfill.server");
  try {
    await startFulfillment(renewal as OrderRow);
  } catch {
    console.error("Renewal fulfillment failed.");
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook received with invalid or missing environment.");
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch {
          console.error("Payment webhook request failed.");
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
