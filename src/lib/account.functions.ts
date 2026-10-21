// src/lib/account.functions.ts — signed-in customer's orders, plan and billing portal.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ILIKE is case-insensitive, but its pattern characters must be treated as
// literal email characters (underscores are common in addresses).
const emailPattern = (email: string) => email.replace(/[\\%_]/g, "\\$&");

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { verifiedAccountEmail, sameVerifiedEmail } = await import("./account-access.server");
    const userId = context.userId;
    const email = await verifiedAccountEmail(userId);
    // Orders are matched by the verified account email (checkout doesn't require sign-in).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const orderColumns = "order_number, product_name, total, status, fuzerx_status, created_at, is_renewal, email";
    const [linkedOrders, subs] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select(orderColumns)
        .eq("user_id", userId)
        .ilike("email", emailPattern(email))
        .neq("status", "pending_payment")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("subscriptions")
        .select("stripe_subscription_id, medication, status, current_period_end, cancel_at_period_end, price_id, created_at, environment, email")
        .eq("user_id", userId)
        .ilike("email", emailPattern(email))
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    if (linkedOrders.error) throw new Error("Could not load your orders.");
    if (subs.error) throw new Error("Could not load your plan.");
    const orders = (linkedOrders.data ?? []).filter((order) => sameVerifiedEmail(order.email, email));
    return { email, orders, subscriptions: (subs.data ?? []).filter((sub) => sameVerifiedEmail(sub.email, email)) };
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ subscriptionId: z.string().min(1), returnUrl: z.string().url() }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    const { verifiedAccountEmail, sameVerifiedEmail } = await import("./account-access.server");
    const userId = context.userId;
    const email = await verifiedAccountEmail(userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id, environment, email")
      .eq("stripe_subscription_id", data.subscriptionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !sub || !sameVerifiedEmail(sub.email, email) || !sub.stripe_customer_id) {
      return { error: "No active plan found for this account." };
    }
    if (sub.environment !== "sandbox" && sub.environment !== "live") {
      return { error: "Billing is not available for this plan." };
    }
    const { createStripeClient, getStripeErrorMessage } = await import("./stripe.server");
    try {
      const portal = await createStripeClient(sub.environment).billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        return_url: data.returnUrl,
      });
      return { url: portal.url };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });
