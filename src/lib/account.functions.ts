// src/lib/account.functions.ts — signed-in customer's orders, plan and billing portal.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function callerEmail(claims: Record<string, unknown>, userId: string) {
  const email = String(claims["email"] ?? "").toLowerCase();
  if (!email) throw new Error("Your account has no email address.");
  return { email, userId };
}

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ environment: z.enum(["sandbox", "live"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { email, userId } = await callerEmail(context.claims as Record<string, unknown>, context.userId);
    // Orders are matched by the verified account email (checkout doesn't require sign-in).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [orders, subs] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("order_number, product_name, total, status, fuzerx_status, created_at, is_renewal")
        .or(`user_id.eq.${userId},email.ilike.${email}`)
        .eq("environment", data.environment)
        .neq("status", "pending_payment")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("subscriptions")
        .select("medication, status, current_period_end, cancel_at_period_end, price_id, created_at")
        .eq("email", email)
        .eq("environment", data.environment)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    return { email, orders: orders.data ?? [], subscriptions: subs.data ?? [] };
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ environment: z.enum(["sandbox", "live"]), returnUrl: z.string().url() }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    const { email } = await callerEmail(context.claims as Record<string, unknown>, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("email", email)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_customer_id) return { error: "No active plan found for this account." };
    const { createStripeClient, getStripeErrorMessage } = await import("./stripe.server");
    try {
      const portal = await createStripeClient(data.environment).billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        return_url: data.returnUrl,
      });
      return { url: portal.url };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });
