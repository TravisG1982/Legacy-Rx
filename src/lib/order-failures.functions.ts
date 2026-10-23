import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const historicalInput = z.object({
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
 * The historical checkout page still imports this function, but that checkout
 * is disabled. A public caller must not be able to write arbitrary contact or
 * medical details to order_failures through the service-role client.
 */
export const logOrderFailure = createServerFn({ method: "POST" })
  .validator((data: unknown) => historicalInput.parse(data))
  .handler(async () => ({ ok: false as const, reason: "unavailable" as const }));
