import { containsLikelyMedicalDetails } from "./contact-message-policy";

type ContactSubmission = {
  submissionId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  transactionalConsent: boolean;
  marketingConsent: boolean;
};

type DeliveryStatus = "pending" | "delivering" | "accepted" | "failed" | "unconfirmed";
type StoredSubmission = {
  name: string;
  email: string;
  phone: string;
  message: string;
  transactional_consent: boolean;
  marketing_consent: boolean;
  delivery_status: DeliveryStatus;
  delivery_attempted_at: string | null;
};

const JOTFORM_ENDPOINT = "https://forms.whitelabelmd.com/submit/251884251086966";

const TRANSACTIONAL_CONSENT_TEXT =
  "I consent to receive transactional text messages from LegacyRX regarding my account, including reminders to complete my signup, order updates, and support messages. Message & data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase.";
const MARKETING_CONSENT_TEXT =
  "I consent to receive marketing text messages from LegacyRX regarding promotions and special offers. Message frequency varies. Message and data rates may apply. Reply HELP for assistance or STOP to opt out.";

function sameSubmission(stored: StoredSubmission, input: ContactSubmission): boolean {
  return (
    stored.name === input.name &&
    stored.email === input.email &&
    stored.phone === input.phone &&
    stored.message === input.message &&
    stored.transactional_consent === input.transactionalConsent &&
    stored.marketing_consent === input.marketingConsent
  );
}

function resultForStatus(stored: StoredSubmission) {
  if (stored.delivery_status === "accepted") return { ok: true as const };
  if (stored.delivery_status === "failed")
    return { ok: false as const, reason: "delivery_failed" as const };
  if (stored.delivery_status === "delivering" && stored.delivery_attempted_at) {
    const attemptedAt = Date.parse(stored.delivery_attempted_at);
    if (Number.isFinite(attemptedAt) && Date.now() - attemptedAt > 30_000)
      return { ok: false as const, reason: "delivery_unconfirmed" as const };
  }
  if (stored.delivery_status === "pending" || stored.delivery_status === "delivering")
    return { ok: false as const, reason: "delivery_pending" as const };
  return { ok: false as const, reason: "delivery_unconfirmed" as const };
}

export async function processContactSubmission(data: ContactSubmission) {
  // This medical-text guard is best effort. The external-delivery privacy risk
  // remains open until support has an approved secure inbox.
  if (containsLikelyMedicalDetails(data.name) || containsLikelyMedicalDetails(data.message)) {
    return { ok: false as const, reason: "medical_details" as const };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const submissions = supabaseAdmin.from("contact_messages");
  const { error: insertError } = await submissions.upsert(
    {
      id: data.submissionId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      transactional_consent: data.transactionalConsent,
      marketing_consent: data.marketingConsent,
      delivery_status: "pending",
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (insertError) throw new Error("Could not save the contact message.");

  const { data: row, error: readError } = await submissions
    .select(
      "name, email, phone, message, transactional_consent, marketing_consent, delivery_status, delivery_attempted_at",
    )
    .eq("id", data.submissionId)
    .single();
  if (readError || !row) throw new Error("Could not verify the contact message.");
  const stored = row as unknown as StoredSubmission;
  if (!sameSubmission(stored, data)) throw new Error("This submission ID is already in use.");
  if (stored.delivery_status !== "pending") return resultForStatus(stored);

  // Claim the one pending attempt atomically. A timeout is not retried because
  // the external form may have accepted it even if our connection was lost.
  const { data: claimed, error: claimError } = await submissions
    .update({
      delivery_status: "delivering",
      delivery_attempted_at: new Date().toISOString(),
    } as never)
    .eq("id", data.submissionId)
    .eq("delivery_status", "pending")
    .select("id")
    .maybeSingle();
  if (claimError) throw new Error("Could not start contact message delivery.");
  if (!claimed) return { ok: false as const, reason: "delivery_pending" as const };

  try {
    const body = new URLSearchParams();
    body.append("formID", "251884251086966");
    body.append("q3_name", data.name);
    body.append("q4_email", data.email);
    body.append("q9_phone9[full]", data.phone);
    body.append("q7_message", data.message);
    if (data.transactionalConsent) {
      body.append("q11_optin_non_marketing_sms_consent[]", TRANSACTIONAL_CONSENT_TEXT);
    }
    if (data.marketingConsent) {
      body.append("q12_optin_marketing_sms_consent[]", MARKETING_CONSENT_TEXT);
    }
    const res = await fetch(JOTFORM_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(10000),
    });
    const status: DeliveryStatus = res.ok ? "accepted" : "failed";
    const { error: updateError } = await submissions
      .update({
        delivery_status: status,
        ...(res.ok ? { delivery_accepted_at: new Date().toISOString() } : {}),
      } as never)
      .eq("id", data.submissionId);
    if (updateError) throw new Error("Could not save delivery status.");
    if (res.ok) return { ok: true as const };
    console.warn("Contact form forwarding failed with HTTP status", res.status);
    return { ok: false as const, reason: "delivery_failed" as const };
  } catch (error) {
    // A timeout or DB update failure leaves delivery uncertain. Never resend
    // this submission automatically; support can reconcile it by ID.
    await submissions
      .update({ delivery_status: "unconfirmed" } as never)
      .eq("id", data.submissionId)
      .eq("delivery_status", "delivering");
    console.warn(
      "Contact form delivery unconfirmed",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false as const, reason: "delivery_unconfirmed" as const };
  }
}
