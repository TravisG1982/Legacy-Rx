import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "../components/LegalPage";

export const Route = createFileRoute("/telehealth-consent")({
  head: () => ({
    meta: [
      { title: "Telehealth Informed Consent - LegacyRX" },
      { name: "description", content: "Informed consent for receiving healthcare services through telehealth on LegacyRX." },
      { property: "og:title", content: "Telehealth Informed Consent - LegacyRX" },
      { property: "og:description", content: "Telehealth informed consent." },
    ],
  }),
  component: () => (
    <LegalPage title="Telehealth Informed Consent">
      <p>By using LegacyRX, you provide informed consent to receive healthcare services through telehealth. Please read the following carefully before proceeding.</p>

      <h2>What Telehealth Is</h2>
      <p>Telehealth involves the delivery of healthcare services using secure electronic communications - including online questionnaires, secure messaging, and, where required, audio or video consultation - between you and a licensed provider who may be in a different location.</p>

      <h2>Potential Benefits</h2>
      <p>Improved access to care; convenience; and timely evaluation and treatment by a licensed provider without an in-person visit.</p>

      <h2>Potential Risks</h2>
      <p>As with any healthcare service, telehealth has potential risks, including: information transmitted may not be sufficient to allow for appropriate decision-making by the provider; delays in evaluation or treatment could occur due to technology failures; and, in rare cases, security protocols could fail, causing a breach of privacy. A provider may determine that telehealth is not appropriate for your condition and recommend in-person care.</p>

      <h2>Your Acknowledgments and Consent</h2>
      <ul>
        <li>I understand that I will be given information about treatments as applicable, including the benefits, risks, possible complications, and alternatives to my care delivered through telehealth.</li>
        <li>I expressly consent to LegacyRX and its affiliated providers obtaining, using, storing, and disclosing my information to necessary third parties as needed to provide the Services and as described in the <Link to="/privacy-policy">Privacy Policy</Link> and <Link to="/hipaa-notice">HIPAA Notice</Link>.</li>
        <li>I understand that the health information I provide may be the only source of health information used by the provider during my evaluation, and I agree to provide accurate and complete information.</li>
        <li>I understand that a prescription is not guaranteed and is issued only if a licensed provider determines it is clinically appropriate.</li>
        <li>I release and hold harmless LegacyRX and my care team from any loss of data or information arising from technical failures associated with the telehealth service.</li>
        <li>I have the right to withhold or withdraw consent to telehealth at any time and to seek traditional in-person care, without affecting my right to future care or benefits.</li>
        <li>I consent to the use of telehealth in the provision of my care and to the terms above.</li>
      </ul>
    </LegalPage>
  ),
});
