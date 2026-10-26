import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { FUSE_PROGRAM_IDS, MED_KEYS, MEDS } from "./legacyrx-data";

const Input = z.object({
  med: z.enum(MED_KEYS),
  leadSessionId: z.string().max(80).optional(),
  email: z.string().trim().email().max(255),
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
  state: z.string().max(40).optional(),
  utm: z.record(z.string(), z.string().max(300)).optional(),
});

const ATTRIBUTION = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "gclid", "fbclid"];

/** Starts a FuseHealth-hosted intake + payment session for one product. */
export const createFuseCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const programId = FUSE_PROGRAM_IDS[data.med];
    if (!programId) throw new Error("This treatment isn't available online yet.");
    const { requireCompletedAssessment } = await import("./assessment.server");
    await requireCompletedAssessment(data.med, data.email);
    const { fuseBrandFetch } = await import("./fuse-brand.server");

    const metadata: Record<string, string> = { med: data.med };
    if (data.leadSessionId) metadata["lead_id"] = data.leadSessionId;
    for (const k of ATTRIBUTION) if (data.utm?.[k]) metadata[k] = data.utm[k]!;

    const res = await fuseBrandFetch<{ data: { sessionId: string; embedUrl: string; expiresAt: string } }>(
      "/checkout/sessions",
      { method: "POST", body: { programId, metadata } },
    );
    const s = res.data;

    if (!s.sessionId || !s.embedUrl) throw new Error("FuseHealth did not return a checkout session.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const plan = MEDS[data.med].plans[0]!;
    const { error } = await supabaseAdmin.from("orders").insert({
      order_number: `LRX-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`,
      session_id: data.leadSessionId ?? null,
      email: data.email.toLowerCase(),
      first_name: data.firstName ?? null,
      last_name: data.lastName ?? null,
      phone: data.phone ?? null,
      state: data.state ?? null,
      medication: data.med,
      plan_id: plan.id,
      product_id: programId,
      product_name: MEDS[data.med].co,
      subtotal: 0,
      total: 0,
      status: "pending_payment",
      fuse_session_id: s.sessionId,
      provider_last_event: "FuseHealth checkout started",
    } as never);
    if (error) {
      console.error("Could not save FuseHealth checkout session.");
      throw new Error("We couldn't open the secure form. Please try again.");
    }
    return { embedUrl: s.embedUrl, sessionId: s.sessionId };
  });
