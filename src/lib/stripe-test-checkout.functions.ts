// Test-mode LegacyRX Stripe payment. Independent of /start/$med (FuseHealth) and of Beluga.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MED_KEYS, MEDS, type MedKey } from "./legacyrx-data";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const StartInput = z.object({
  med: z.enum(MED_KEYS),
  plan: z.enum(["1", "3", "6", "12"]),
  email: z.string().trim().email().max(255),
});

const StatusInput = z.object({
  orderId: z.string().uuid(),
  token: z.string().regex(/^[0-9a-f]{64}$/),
});

const OPEN_STATUSES = ["pending_payment", "payment_failed"];
// Leave a minute of margin above Stripe Checkout's minimum expiration window.
const SESSION_MINUTES = 31;
const UNAVAILABLE = "Test payments are not available.";
const RETRY = "We could not start the payment. Please try again.";

/** The charged amount is derived here from the catalog; the browser only names a product and plan. */
export function serverAmountCents(med: MedKey, planId: string): number | null {
  const plan = MEDS[med].plans.find((p) => p.id === planId);
  if (!plan || !Number.isFinite(plan.total) || plan.total <= 0) return null;
  return Math.round(plan.total * 100);
}

function siteOrigin(): string {
  const configured = process.env["STRIPE_TEST_RETURN_ORIGIN"];
  if (!configured) throw new Error("Test payment return URL is not configured.");
  let url: URL;
  try { url = new URL(configured); } catch { throw new Error("Test payment return URL is invalid."); }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
      url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Test payment return URL is invalid.");
  }
  return url.origin;
}

/** Creates (or reuses the still-open) Stripe Checkout session for a test order. */
export const createStripeTestPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StartInput.parse(d))
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    const { requireStripeTest, StripeTestUnavailableError, captureMethod, newAccessToken } = await import("./stripe-test.server");
    let stripe;
    try {
      stripe = requireStripeTest();
    } catch (error) {
      if (error instanceof StripeTestUnavailableError) throw new Error(UNAVAILABLE);
      throw error;
    }
    // This is a QA-only payment path, not a public alternative to FuseHealth.
    // Require both a verified account and an explicitly configured test identity.
    const allowedEmail = process.env["STRIPE_TEST_ALLOWED_EMAIL"]?.trim().toLowerCase();
    const { verifiedAccountEmail } = await import("./account-access.server");
    const verifiedEmail = await verifiedAccountEmail(context.userId);
    if (!allowedEmail || data.email.toLowerCase() !== allowedEmail || verifiedEmail.toLowerCase() !== allowedEmail) {
      throw new Error(UNAVAILABLE);
    }
    const { requireCompletedAssessment } = await import("./assessment.server");
    await requireCompletedAssessment(data.med, data.email);
    const amount = serverAmountCents(data.med, data.plan);
    if (!amount) throw new Error("This plan is not available.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const origin = siteOrigin();

    for (let attempt = 0; attempt < 2; attempt++) {
      const { data: open, error: openError } = await supabaseAdmin
        .from("payment_test_orders")
        .select("id, stripe_session_id")
        .eq("email", email)
        .eq("medication", data.med)
        .eq("plan_id", data.plan)
        .in("status", OPEN_STATUSES)
        .maybeSingle();
      if (openError) throw new Error(RETRY);

      if (open) {
        // Repeat click: send the buyer back to the same open session instead of creating another order.
        if (!open.stripe_session_id) throw new Error("Payment is already starting. Please wait a moment and try again.");
        try {
          const existing = await stripe.checkout.sessions.retrieve(open.stripe_session_id);
          if (existing.status === "open" && existing.url) return { url: existing.url };
        } catch {
          // An unreadable session is unusable; replace it below.
        }
        await supabaseAdmin.from("payment_test_orders").update({ status: "abandoned" }).eq("id", open.id).in("status", OPEN_STATUSES);
      }

      const { token, hash } = newAccessToken();
      const orderNumber = `LRXT-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
      const { data: order, error } = await supabaseAdmin
        .from("payment_test_orders")
        .insert({ order_number: orderNumber, email, medication: data.med, plan_id: data.plan, amount_cents: amount, access_token_hash: hash })
        .select("id")
        .single();
      if (error?.code === "23505") continue; // a concurrent click created the open order; reuse it
      if (error || !order) throw new Error(RETRY);

      let createdSessionId: string | null = null;
      try {
        const session = await stripe.checkout.sessions.create(
          {
            mode: "payment",
            // Only opaque identifiers go to Stripe: no email, product, plan or health data.
            line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: amount, product_data: { name: `LegacyRX order ${orderNumber}` } } }],
            client_reference_id: order.id,
            metadata: { order_id: order.id },
            payment_intent_data: { capture_method: captureMethod(), metadata: { order_id: order.id } },
            expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
            success_url: `${origin}/pay-test/result?o=${order.id}&t=${token}`,
            cancel_url: `${origin}/pay-test/result?o=${order.id}&t=${token}&cancelled=1`,
          },
          { idempotencyKey: `payment-test-session:${order.id}` },
        );
        if (!session.url || session.livemode) throw new Error("Unexpected session.");
        createdSessionId = session.id;
        const { data: saved, error: saveError } = await supabaseAdmin.from("payment_test_orders")
          .update({ stripe_session_id: session.id }).eq("id", order.id).is("stripe_session_id", null)
          .select("stripe_session_id").maybeSingle();
        if (saveError) throw new Error("Could not save the test session.");
        if (!saved) {
          // A webhook may have filled the same ID before this write completed.
          const { data: current, error: readError } = await supabaseAdmin.from("payment_test_orders")
            .select("stripe_session_id").eq("id", order.id).maybeSingle();
          if (readError || current?.stripe_session_id !== session.id) throw new Error("Could not save the test session.");
        }
        return { url: session.url };
      } catch {
        if (createdSessionId) {
          try { await stripe.checkout.sessions.expire(createdSessionId); } catch { /* Best effort: no URL was returned. */ }
        }
        await supabaseAdmin.from("payment_test_orders").update({ status: "abandoned" }).eq("id", order.id).eq("status", "pending_payment");
        throw new Error(RETRY);
      }
    }
    throw new Error(RETRY);
  });

/** Status of one test order. The unguessable token is the only credential; a wrong value looks like a missing order. */
export const getStripeTestOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => StatusInput.parse(d))
  .handler(async ({ data }) => {
    const { stripeTestEnabled, tokenMatches } = await import("./stripe-test.server");
    if (!stripeTestEnabled()) throw new Error(UNAVAILABLE);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("payment_test_orders")
      .select("order_number, status, amount_cents, access_token_hash")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error("Could not load this order right now.");
    if (!order || !tokenMatches(data.token, order.access_token_hash)) throw new Error("This order is not available.");
    return { orderNumber: order.order_number, status: order.status, amountCents: order.amount_cents };
  });
