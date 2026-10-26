// src/lib/orders.server.ts — order housekeeping.
// Server-only; imported lazily from handlers.

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
