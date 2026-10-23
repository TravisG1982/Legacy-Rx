import { verifiedAccountEmail, sameVerifiedEmail } from "./account-access.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ILIKE wildcards in email addresses must be escaped before the database filter.
const emailPattern = (email: string) => email.replace(/[\\%_]/g, "\\$&");

export async function loadVerifiedOrderStatus(userId: string, orderNumber: string) {
  const email = await verifiedAccountEmail(userId);
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("order_number, status, email")
    .eq("order_number", orderNumber)
    .eq("user_id", userId)
    .ilike("email", emailPattern(email))
    .neq("status", "pending_payment")
    .maybeSingle();
  if (error) throw new Error("Could not load this order right now.");
  if (!order || !sameVerifiedEmail(order.email, email)) {
    throw new Error("This order is not available in your account.");
  }
  return { orderNumber: order.order_number, status: order.status };
}
