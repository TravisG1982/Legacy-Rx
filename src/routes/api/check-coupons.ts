import { createFileRoute } from "@tanstack/react-router";

/** Checks a promo code against the admin-managed coupon list. */
export const Route = createFileRoute("/api/check-coupons")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let code = "";
        let med = "";
        try {
          const body = (await request.json()) as { code?: string; med?: string };
          code = String(body.code ?? "").trim().slice(0, 64);
          med = String(body.med ?? "").trim();
        } catch {
          return Response.json({ valid: false, message: "Invalid request." }, { status: 400 });
        }
        if (!code) return Response.json({ valid: false, message: "Enter a promo code." }, { status: 400 });
        const { checkCouponServer } = await import("@/lib/coupon.server");
        try {
          return Response.json(await checkCouponServer(code, { med: med || undefined }));
        } catch {
          return Response.json({ valid: false, code, message: "Could not verify that code right now." });
        }
      },
    },
  },
});
