import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { LeadRow, LeadStage } from "./leads-types";

const upsertSchema = z.object({
  sessionId: z.string().min(8).max(80),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  email: z.string().trim().max(255).optional(),
  phone: z.string().trim().max(40).optional(),
  state: z.string().trim().max(60).optional(),
  age18: z.string().trim().max(10).nullish(),
  onGlp1: z.string().trim().max(10).nullish(),
  emailConsent: z.boolean().optional(),
  emailMarketingConsent: z.boolean().optional(),
  smsTransactionalConsent: z.boolean().optional(),
  smsMarketingConsent: z.boolean().optional(),
  stage: z
    .enum([
      "unregistered",
      "registered",
      "health_screen",
      "plan_selection",
      "added_to_cart",
      "checkout_contact",
      "checkout_started",
      "payment_step",
      "payment_attempt",
      "ordered",

      "not_eligible",
    ])
    .optional(),
});


/**
 * Public write endpoint. Funnel visitors are anonymous, so the upsert runs with
 * the service-role client inside the handler; the table has no anon grants, so
 * lead data can never be read back from the browser.
 */
export const upsertFunnelLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { STAGES } = await import("./leads.server");

    const patch: Record<string, string | boolean | null> = { session_id: data.sessionId };
    if (data.firstName !== undefined) patch['first_name'] = data.firstName || null;
    if (data.lastName !== undefined) patch['last_name'] = data.lastName || null;
    if (data.email !== undefined) patch['email'] = data.email || null;
    if (data.phone !== undefined) patch['phone'] = data.phone || null;
    if (data.state !== undefined) patch['state'] = data.state || null;
    if (data.age18 !== undefined) patch['age_18'] = data.age18 || null;
    if (data.onGlp1 !== undefined) patch['on_glp1'] = data.onGlp1 || null;
    if (data.emailConsent !== undefined) patch['email_consent'] = data.emailConsent;
    if (data.emailMarketingConsent !== undefined)
      patch['email_marketing_consent'] = data.emailMarketingConsent;
    if (data.smsTransactionalConsent !== undefined)
      patch['sms_transactional_consent'] = data.smsTransactionalConsent;
    if (data.smsMarketingConsent !== undefined)
      patch['sms_marketing_consent'] = data.smsMarketingConsent;

    const { data: existing } = await supabaseAdmin
      .from("funnel_leads")
      .select("id, stage")
      .eq("session_id", data.sessionId)
      .maybeSingle();

    // Never walk the stage backwards: keep the furthest point reached.
    if (data.stage) {
      const currentIndex = existing?.stage ? STAGES.indexOf(existing.stage as LeadStage) : -1;
      const nextIndex = STAGES.indexOf(data.stage);
      if (data.stage === "not_eligible" || nextIndex > currentIndex) patch['stage'] = data.stage;
    }

    // Don't create empty rows: a visitor who typed nothing identifiable has
    // nothing worth showing on the dashboard.
    const hasIdentity = Boolean(
      data.firstName?.trim() || data.lastName?.trim() || data.email?.trim() || data.phone?.trim(),
    );
    if (!existing && !hasIdentity) return { ok: true as const };

    if (existing) {
      const { error } = await supabaseAdmin
        .from("funnel_leads")
        .update(patch as never)
        .eq("session_id", data.sessionId);
      if (error) throw new Error("Could not save lead.");
    } else {
      // Concurrent first writes can both see "no row"; upsert on the unique
      // session_id so the loser updates instead of failing.
      const { error } = await supabaseAdmin
        .from("funnel_leads")
        .upsert(patch as never, { onConflict: "session_id" });
      if (error) throw new Error("Could not save lead.");
    }


    return { ok: true as const };
  });

export const deleteFunnelLeads = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { requireAdminAccess, auditAdminAction, validateAdminInput } = await import("./admin-access.server");
    const actor = await requireAdminAccess("delete_leads", "delete_leads", "funnel_leads");
    const input = await validateAdminInput(actor.userId, "delete_leads", "funnel_leads", data,
      (value) => z.object({ ids: z.array(z.string().uuid()).min(1).max(500) }).parse(value));

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let response: Awaited<ReturnType<typeof supabaseAdmin.rpc<"delete_admin_funnel_leads">>>;
    try {
      response = await supabaseAdmin.rpc("delete_admin_funnel_leads", {
        p_actor_id: actor.userId, p_lead_ids: input.ids,
      });
    } catch {
      await auditAdminAction(actor.userId, "delete_leads", "funnel_leads", null, "failure");
      throw new Error("Could not delete leads.");
    }
    if (response.error) {
      await auditAdminAction(actor.userId, "delete_leads", "funnel_leads", null, response.error.code === "42501" ? "denied" : "failure");
      throw new Error("Could not delete leads.");
    }
    return { ok: true as const, deleted: response.data ?? 0 };
  });

// POST (not GET) so the browser never answers a refresh from its HTTP cache.
export const listFunnelLeads = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data }) => {
  const { requireAdminAccess, auditAdminAction, validateAdminInput } = await import("./admin-access.server");
  const actor = await requireAdminAccess("view_leads", "view_leads", "funnel_leads");
  await validateAdminInput(actor.userId, "view_leads", "funnel_leads", data ?? {},
    (value) => z.object({ t: z.number().int().optional() }).parse(value));

  try {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: leadData, error } = await supabaseAdmin
    .from("funnel_leads")
    .select(
      "id, first_name, last_name, email, phone, state, age_18, on_glp1, email_consent, email_marketing_consent, sms_transactional_consent, sms_marketing_consent, stage, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) {
    throw new Error(error.message);
  }

  const { sweepAbandonedOrders } = await import("./orders.server");
  await sweepAbandonedOrders().catch(() => {});

  // Attach the completed sale (if any) so paid customers are visible as such.
  // Unpaid/abandoned checkouts are not sales.
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from("orders")
    .select("order_number, email, session_id, total, created_at")
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (ordersError) {
    throw new Error("Could not load paid orders.");
  }

  const byEmail = new Map<string, { order_number: string; total: number }>();
  for (const o of orders ?? []) {
    const key = (o.email ?? "").trim().toLowerCase();
    if (!key || byEmail.has(key)) continue;
    byEmail.set(key, { order_number: o.order_number, total: Number(o.total) });
  }

  const leads = (leadData ?? []).map((l) => {
    const match = byEmail.get((l.email ?? "").trim().toLowerCase());
    return {
      ...l,
      order_number: match?.order_number ?? null,
      order_total: match?.total ?? null,
      stage: match ? "ordered" : l.stage,
    };
  }) as LeadRow[];

  await auditAdminAction(actor.userId, "view_leads", "funnel_leads", null, "success");
  return { unlocked: true as const, leads };
  } catch (error) {
    await auditAdminAction(actor.userId, "view_leads", "funnel_leads", null, "failure");
    throw error;
  }
});

/** Recheck access and record an export before offering downloaded lead data. */
export const authorizeLeadExport = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdminAccess, auditAdminAction } = await import("./admin-access.server");
  const actor = await requireAdminAccess("view_leads", "export_leads", "funnel_leads");
  await auditAdminAction(actor.userId, "export_leads", "funnel_leads", null, "success");
  return { ok: true as const };
});
