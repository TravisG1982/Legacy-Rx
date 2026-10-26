// src/lib/account.functions.ts — signed-in customer's orders and order status.
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
    const orderColumns =
      "order_number, product_name, total, status, created_at, is_renewal, email";
    const linkedOrders = await supabaseAdmin
      .from("orders")
      .select(orderColumns)
      .eq("user_id", userId)
      .ilike("email", emailPattern(email))
      .neq("status", "pending_payment")
      .order("created_at", { ascending: false })
      .limit(50);
    if (linkedOrders.error) throw new Error("Could not load your orders.");
    const orders = (linkedOrders.data ?? []).filter((order) =>
      sameVerifiedEmail(order.email, email),
    );
    return { email, orders };
  });

/** Each status request independently verifies the account email and order ownership. */
export const getMyOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ orderNumber: z.string().trim().min(1).max(64) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { loadVerifiedOrderStatus } = await import("./account-order-status.server");
    return loadVerifiedOrderStatus(context.userId, data.orderNumber);
  });
