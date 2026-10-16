import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(40),
  message: z.string().trim().min(1).max(4000),
  transactionalConsent: z.boolean(),
  marketingConsent: z.boolean(),
});

const JOTFORM_ENDPOINT = "https://forms.whitelabelmd.com/submit/251884251086966";

const TRANSACTIONAL_CONSENT_TEXT =
  "I consent to receive transactional text messages from LegacyRX regarding my account, including reminders to complete my signup, order updates, and support messages. Message & data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase.";
const MARKETING_CONSENT_TEXT =
  "I consent to receive marketing text messages from LegacyRX regarding promotions and special offers. Message frequency varies. Message and data rates may apply. Reply HELP for assistance or STOP to opt out.";

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      transactional_consent: data.transactionalConsent,
      marketing_consent: data.marketingConsent,
    } as never);
    if (error) throw new Error(error.message);

    // Forward the same submission to the LegacyRX form backend.
    let forwarded = false;
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
      });
      forwarded = res.ok;
    } catch {
      forwarded = false;
    }

    return { ok: true as const, forwarded };
  });
