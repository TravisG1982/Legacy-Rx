// src/lib/checkout-session.functions.ts — server-side pricing, coupon
// validation, order creation and payment-session creation. The client never
// decides the charged amount.
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { totalWithCoupon, type CouponResult } from "./coupon";
import { planPrice } from "./pricing-types";
import { MED_KEYS, MEDS, productFor } from "./legacyrx-data";
import type { OrderRow } from "./fulfill.server";

const Input = z.object({
  sessionId: z.string().optional(),
  environment: z.enum(["sandbox", "live"]),
  med: z.enum(MED_KEYS),
  planId: z.enum(["1", "3", "6", "12"]),
  couponCode: z.string().optional().nullable(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/),
  street: z.string().min(1),
  apt: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().min(2),
  zip: z.string().regex(/^\d{5}$/),
  dob: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  gender: z.enum(["male", "female"]),
  onGlp1: z.enum(["yes", "no"]).optional(),
  conditions: z.string().max(2000).optional(),
  returnUrl: z.string().url(),
});

export type CheckoutSessionResult =
  | { mode: "stripe"; clientSecret: string; orderNumber: string }
  | { mode: "free"; orderNumber: string; fuzerxStatus: string | null }
  | { error: string };

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const { fetchLivePrices } = await import("./pricing.server");
      const { validateCouponServer } = await import("./coupon.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const { sweepAbandonedOrders } = await import("./orders.server");
      await sweepAbandonedOrders().catch(() => {});

      // Link the order to the signed-in customer when a valid session is sent.
      let userId: string | null = null;
      const auth = getRequestHeader("authorization");
      if (auth?.startsWith("Bearer ")) {
        const { data: u } = await supabaseAdmin.auth.getUser(auth.slice(7));
        userId = u.user?.id ?? null;
      }

      if (!MEDS[data.med].plans.some((p) => p.id === data.planId)) throw new Error("That plan isn't available for this product.");
      const product = productFor(data.med, data.planId);
      const prices = await fetchLivePrices();
      const subtotal = planPrice(prices.prices, data.med, data.planId).total;

      let coupon: CouponResult | null = null;
      if (data.couponCode) {
        coupon = await validateCouponServer(data.couponCode, { med: data.med });
        if (!coupon) throw new Error("That promo code isn't valid any more. Remove it to continue.");
      }
      const payable = totalWithCoupon(subtotal, coupon);
      const discount = Math.max(0, subtotal - payable);
      const cents = Math.round(payable * 100);

      const orderNumber = `LRX-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;

      const { data: order, error: insertError } = await supabaseAdmin
        .from("orders")
        .insert({
          order_number: orderNumber,
          session_id: data.sessionId ?? null,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          street: data.street,
          apt: data.apt ?? null,
          city: data.city,
          state: data.state,
          zip: data.zip,
          dob: data.dob,
          gender: data.gender,
          medication: data.med,
          plan_id: data.planId,
          product_id: product.productId,
          product_name: product.name,
          subtotal: Number(subtotal.toFixed(2)),
          discount: Number(discount.toFixed(2)),
          total: Number(payable.toFixed(2)),
          coupon_code: coupon?.valid ? coupon.code : null,
          payment_mode: data.environment,
          status: "pending_payment",
          environment: data.environment,
          user_id: userId,
        })
        .select("*")
        .single();
      if (insertError || !order) throw new Error(insertError?.message ?? "Could not create the order");

      // A code that covers the full amount: no payment session is needed.
      if (cents <= 0) {
        await supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", order.id);
        const { redeemCoupon } = await import("./coupon.server");
        await redeemCoupon(order.coupon_code);
        const { startFulfillment } = await import("./fulfill.server");
        const fulfilled = await startFulfillment(
          { ...order, status: "paid" } as OrderRow,
          { onGlp1: data.onGlp1, conditions: data.conditions },
        );
        return { mode: "free", orderNumber, fuzerxStatus: fulfilled.fuzerx_status ?? null };
      }

      if (cents < 50) {
        throw new Error("This total is too small to charge online. Our team will complete your order by phone.");
      }

      const { createStripeClient } = await import("./stripe.server");
      const stripe = createStripeClient(data.environment);

      // Customer carries userId/email so account pages and the billing portal resolve it.
      let customerId: string;
      const byEmail = await stripe.customers.list({ email: data.email, limit: 1 });
      if (byEmail.data.length) {
        customerId = byEmail.data[0].id;
        if (userId && byEmail.data[0].metadata?.userId !== userId) {
          await stripe.customers.update(customerId, { metadata: { ...byEmail.data[0].metadata, userId } });
        }
      } else {
        const created = await stripe.customers.create({
          email: data.email,
          name: `${data.firstName} ${data.lastName}`,
          ...(userId && { metadata: { userId } }),
        });
        customerId = created.id;
      }

      // Monthly renewal starts once the prepaid plan period ends.
      const recurring = await stripe.prices.list({ lookup_keys: [`${data.med}_monthly`] });
      if (!recurring.data.length) throw new Error("Renewal price not found");
      const months = Number(data.planId);
      const renewAt = new Date();
      renewAt.setMonth(renewAt.getMonth() + months);
      const meta = {
        orderId: orderNumber,
        sessionId: data.sessionId ?? "",
        med: data.med,
        planId: data.planId,
        environment: data.environment,
        email: data.email,
        userId: userId ?? "",
        onGlp1: data.onGlp1 ?? "",
        conditions: (data.conditions ?? "").slice(0, 490),
      };

      const session = await stripe.checkout.sessions.create({
        ui_mode: "embedded_page",
        mode: "subscription",
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: cents,
              product_data: { name: product.name },
            },
            quantity: 1,
          },
          { price: recurring.data[0].id, quantity: 1 },
        ],
        subscription_data: {
          trial_end: Math.floor(renewAt.getTime() / 1000),
          metadata: meta,
          description: `${product.name} — renews monthly`,
        },
        metadata: meta,
        return_url: data.returnUrl,
      });
      if (!session.client_secret) throw new Error("Payment session could not be created");

      await supabaseAdmin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

      return { mode: "stripe", clientSecret: session.client_secret, orderNumber };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { error: msg.startsWith("Stripe") || /stripe/i.test(msg) ? msg : `Checkout error: ${msg}` };
    }
  });

export const getCheckoutStatus = createServerFn({ method: "GET" })
  .inputValidator((data: { sessionId: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("status, order_number, fuzerx_status, total")
      .eq("stripe_session_id", data.sessionId)
      .maybeSingle();
    if (!order) return { found: false as const };
    return {
      found: true as const,
      status: order.status as string,
      orderNumber: order.order_number as string,
      fuzerxStatus: (order.fuzerx_status as string | null) ?? null,
      total: Number(order.total),
    };
  });
