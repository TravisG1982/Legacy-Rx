import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "../components/LegalPage";

export const Route = createFileRoute("/important-safety-information")({
  head: () => ({
    meta: [
      { title: "Important Safety Information - LegacyRX" },
      { name: "description", content: "Important Safety Information for compounded GLP-1 medications including warnings, side effects, and contraindications." },
      { property: "og:title", content: "Important Safety Information - LegacyRX" },
      { property: "og:description", content: "Warnings, side effects, and contraindications for compounded GLP-1 medications." },
    ],
  }),
  component: () => (
    <LegalPage title="Important Safety Information">
      <p className="allcaps">ALWAYS SEEK THE ADVICE OF YOUR PHYSICIAN OR OTHER QUALIFIED HEALTH PROVIDER WITH ANY QUESTIONS YOU MAY HAVE REGARDING A MEDICAL CONDITION. THIS PAGE IS INFORMATIONAL AND IS NOT A SUBSTITUTE FOR PROFESSIONAL MEDICAL ADVICE.</p>

      <h2>About Compounded GLP-1 Medications</h2>
      <p>Compounded semaglutide and compounded tirzepatide are <strong>not FDA-approved</strong>. The FDA does not evaluate compounded medications for safety, effectiveness, or quality. Compounded medications are prepared by state-licensed pharmacies pursuant to a prescription written by a licensed provider for an individual patient. Semaglutide and tirzepatide are the active ingredients also found in certain FDA-approved branded products; compounded versions are different from those branded products.</p>

      <h2>Boxed Warning - Risk of Thyroid C-Cell Tumors</h2>
      <p>In rodent studies, GLP-1 receptor agonists caused thyroid C-cell tumors. It is unknown whether these medications cause such tumors, including medullary thyroid carcinoma (MTC), in humans. <strong>Do not use</strong> if you or a family member has a history of MTC or Multiple Endocrine Neoplasia syndrome type 2 (MEN 2).</p>

      <h2>Do Not Use If</h2>
      <ul>
        <li>You or a family member has had MTC or MEN 2;</li>
        <li>You have had a serious allergic reaction to semaglutide, tirzepatide, or any of their ingredients;</li>
        <li>You are pregnant, planning to become pregnant, or breastfeeding.</li>
      </ul>

      <h2>Warnings &amp; Precautions</h2>
      <p>Tell your provider before and during treatment about all your medical conditions. Serious risks may include: inflammation of the pancreas (pancreatitis); gallbladder problems; low blood sugar (hypoglycemia), especially when used with insulin or a sulfonylurea; acute kidney injury (often related to dehydration from nausea, vomiting, or diarrhea); serious allergic reactions; diabetic retinopathy complications; and gallbladder disease. Stop use and seek medical attention for severe, persistent abdominal pain or signs of an allergic reaction.</p>

      <h2>Common Side Effects</h2>
      <p>The most common side effects include nausea, vomiting, diarrhea, constipation, abdominal pain, indigestion, decreased appetite, fatigue, and injection-site reactions. These often lessen over time.</p>

      <h2>Drug Interactions &amp; Other Medications</h2>
      <p>Tell your provider about all medicines you take, including prescription and over-the-counter medicines, vitamins, and supplements. These medications may affect how other medicines are absorbed because they slow stomach emptying.</p>

      <h2>Pregnancy &amp; Breastfeeding</h2>
      <p>Do not use if you are pregnant, may become pregnant, or are breastfeeding. Tell your provider if you become pregnant during treatment.</p>

      <h2>Reporting Side Effects</h2>
      <p>You are encouraged to report negative side effects of prescription drugs to the FDA. Visit www.fda.gov/medwatch or call 1-800-FDA-1088. <strong>If you are experiencing a medical emergency, call 9-1-1 immediately.</strong></p>
    </LegalPage>
  ),
});
