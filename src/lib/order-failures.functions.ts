import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const failureSchema = z.object({
  sessionId: z.string().trim().max(80).optional(),
  email: z.string().trim().max(255).optional(),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(40).optional(),
  state: z.string().trim().max(60).optional(),
  medication: z.string().trim().max(40).optional(),
  planId: z.string().trim().max(10).optional(),
  productId: z.string().trim().max(40).optional(),
  couponCode: z.string().trim().max(40).optional(),
  amount: z.number().nonnegative().optional(),
  reason: z.string().trim().max(500).optional(),
});

/**
 * Records a checkout attempt that the order service rejected, so blocked
 * purchases are visible instead of silently lost. Writes with the service-role
 * client inside the handler; the table has no anon/authenticated grants, so
 * nothing can be read back from the browser.
 */
export const logOrderFailure = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => failureSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("order_failures").insert({
      session_id: data.sessionId ?? null,
      email: data.email ?? null,
      first_name: data.firstName ?? null,
      last_name: data.lastName ?? null,
      phone: data.phone ?? null,
      state: data.state ?? null,
      medication: data.medication ?? null,
      plan_id: data.planId ?? null,
      product_id: data.productId ?? null,
      coupon_code: data.couponCode ?? null,
      amount: data.amount ?? null,
      reason: data.reason ?? null,
    });
    return { ok: true };
  });
