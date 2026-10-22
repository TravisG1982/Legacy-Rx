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
      if (error) throw new Error(error.message);
    } else {
      // Concurrent first writes can both see "no row"; upsert on the unique
      // session_id so the loser updates instead of failing.
      const { error } = await supabaseAdmin
        .from("funnel_leads")
        .upsert(patch as never, { onConflict: "session_id" });
      if (error) throw new Error(error.message);
    }


    return { ok: true as const };
  });

export const unlockTravis = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ password: z.string().max(200) }).parse(data))
  .handler(async ({ data }) => {
    const { passwordMatches, travisSession } = await import("./leads.server");
    const expected = process.env['TRAVIS_PASSWORD'];
    if (!expected) throw new Error("Admin password is not configured.");
    if (!passwordMatches(data.password, expected)) return { ok: false as const };
    const session = await travisSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockTravis = createServerFn({ method: "POST" }).handler(async () => {
  const { travisSession } = await import("./leads.server");
  const session = await travisSession();
  await session.clear();
  return { ok: true as const };
});

export const deleteFunnelLeads = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(500) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { travisSession } = await import("./leads.server");
    const session = await travisSession();
    if (!session.data.unlocked) return { ok: false as const, deleted: 0 };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error, count } = await supabaseAdmin
      .from("funnel_leads")
      .delete({ count: "exact" })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true as const, deleted: count ?? data.ids.length };
  });

// POST (not GET) so the browser never answers a refresh from its HTTP cache.
export const listFunnelLeads = createServerFn({ method: "POST" })
  .inputValidator((input: { t?: number } | undefined) => input ?? {})
  .handler(async () => {
  const { travisSession } = await import("./leads.server");
  const session = await travisSession();
  if (!session.data.unlocked) return { unlocked: false as const, leads: [] as LeadRow[] };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("funnel_leads")
    .select(
      "id, first_name, last_name, email, phone, state, age_18, on_glp1, email_consent, email_marketing_consent, sms_transactional_consent, sms_marketing_consent, stage, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);

  const { sweepAbandonedOrders } = await import("./orders.server");
  await sweepAbandonedOrders().catch(() => {});

  // Attach the completed sale (if any) so paid customers are visible as such.
  // Unpaid/abandoned checkouts are not sales.
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("order_number, email, session_id, total, created_at")
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(5000);

  const byEmail = new Map<string, { order_number: string; total: number }>();
  for (const o of orders ?? []) {
    const key = (o.email ?? "").trim().toLowerCase();
    if (!key || byEmail.has(key)) continue;
    byEmail.set(key, { order_number: o.order_number, total: Number(o.total) });
  }

  const leads = (data ?? []).map((l) => {
    const match = byEmail.get((l.email ?? "").trim().toLowerCase());
    return {
      ...l,
      order_number: match?.order_number ?? null,
      order_total: match?.total ?? null,
      stage: match ? "ordered" : l.stage,
    };
  }) as LeadRow[];

  return { unlocked: true as const, leads };
});
