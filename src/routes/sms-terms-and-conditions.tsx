import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/sms-terms-and-conditions")({
  head: () => ({
    meta: [
      { title: "SMS Terms and Conditions - LegacyRX" },
      {
        name: "description",
        content:
          "LegacyRX SMS terms and conditions: message types, frequency, data rates, opt-in and opt-out instructions, and support contacts.",
      },
      { property: "og:title", content: "SMS Terms and Conditions - LegacyRX" },
      { property: "og:description", content: "How LegacyRX text messaging works, including opt-in and opt-out instructions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SmsTermsPage,
});

function SmsTermsPage() {
  return (
    <LegalPage title="SMS Terms and Conditions">
      <h2>Program description</h2>
      <p>
        By providing your mobile number and checking the applicable consent box, you agree to receive text messages from
        LegacyRX. Transactional messages include account notices, reminders to complete your signup, order and shipping
        updates, and support replies. Marketing messages include promotions and special offers. Consent to marketing
        messages is not a condition of purchase.
      </p>

      <h2>Message frequency and cost</h2>
      <p>
        Message frequency varies. Message and data rates may apply. LegacyRX does not charge for text messages, but your
        mobile carrier's standard rates apply.
      </p>

      <h2>Opt out</h2>
      <p>
        Reply STOP to any message to stop receiving text messages. You will receive a single confirmation message and no
        further texts, other than messages required to service an active order where permitted by law.
      </p>

      <h2>Help</h2>
      <p>
        Reply HELP for assistance, or contact us at <a href="mailto:support@legacyrx.net">support@legacyrx.net</a> or +1
        877 361 8113.
      </p>

      <h2>Carriers and delivery</h2>
      <p>
        Carriers are not liable for delayed or undelivered messages. Message delivery depends on your carrier's network
        and your device.
      </p>

      <h2>Privacy</h2>
      <p>
        Mobile information will not be sold or shared with third parties for marketing or promotional purposes. All
        handling of your information is governed by our Privacy Policy.
      </p>
    </LegalPage>
  );
}
