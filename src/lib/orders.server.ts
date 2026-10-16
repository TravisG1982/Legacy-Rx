// src/lib/orders.server.ts — order housekeeping and subscription records.
// Server-only; imported lazily from handlers.
import type { StripeEnv } from "./stripe.server";

/** Orders left unpaid for 24h become "abandoned" (lost sales in /travis). */
export async function sweepAbandonedOrders() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin
    .from("orders")
    .update({ status: "abandoned" })
    .eq("status", "pending_payment")
    .lt("created_at", cutoff);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySub = any;

/** Mirrors a payment subscription into the subscriptions table. */
export async function upsertSubscription(sub: AnySub, env: StripeEnv) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const item = sub.items?.data?.[0];
  const priceId = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id || "";
  const start = item?.current_period_start ?? sub.current_period_start;
  const end = item?.current_period_end ?? sub.current_period_end ?? sub.trial_end;
  const meta = sub.metadata ?? {};
  let email: string = meta.email ?? "";
  if (!email && typeof sub.customer === "string") {
    const { createStripeClient } = await import("./stripe.server");
    const c = await createStripeClient(env).customers.retrieve(sub.customer);
    if (!("deleted" in c && c.deleted)) email = (c as { email?: string | null }).email ?? "";
  }
  const status = sub.status === "trialing" ? "active" : sub.status;
  await supabaseAdmin.from("subscriptions").upsert(
    {
      stripe_subscription_id: sub.id,
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
      user_id: meta.userId || null,
      email: email.toLowerCase(),
      medication: meta.med ?? String(priceId).replace(/_monthly$/, ""),
      price_id: priceId,
      first_order_number: meta.orderId ?? null,
      status,
      current_period_start: start ? new Date(start * 1000).toISOString() : null,
      current_period_end: end ? new Date(end * 1000).toISOString() : null,
      cancel_at_period_end: !!sub.cancel_at_period_end || !!sub.cancel_at,
      environment: env,
    },
    { onConflict: "stripe_subscription_id" },
  );
}
