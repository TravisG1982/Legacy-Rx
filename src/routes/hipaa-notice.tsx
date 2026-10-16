import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "../components/LegalPage";

export const Route = createFileRoute("/hipaa-notice")({
  head: () => ({
    meta: [
      { title: "HIPAA Notice of Privacy Practices - LegacyRx" },
      { name: "description", content: "How LegacyRx may use and disclose your protected health information and your rights under HIPAA." },
      { property: "og:title", content: "HIPAA Notice - LegacyRx" },
      { property: "og:description", content: "Our HIPAA Notice of Privacy Practices." },
    ],
  }),
  component: () => (
    <LegalPage title="HIPAA Notice">
      <p><strong>THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.</strong></p>

      <p>When this Notice of Privacy Practices ("Notice") refers to "we" or "us," it is referring to LegacyRx and all the pharmacists who provide health care services and the employees of our pharmacy. We are required by law to maintain the privacy of your protected health information ("PHI"), to follow the terms of the Notice currently in effect, to give you this Notice setting forth our legal duties and privacy practices concerning your PHI and to notify affected individuals following a breach of unsecured PHI. This Notice describes how we may use and disclose your PHI. Additionally, this Notice explains the rights you have with respect to your PHI, and certain obligations we must abide by in accordance with the law. We reserve the right to amend this Notice. If we make any material revisions to this Notice, we will post a copy of the revised Notice in the pharmacy, on our website and will offer you a copy of the revised Notice.</p>

      <h2>I. Use and Disclosure of Your PHI</h2>
      <p>We will use and disclose your PHI for treatment, payment and health care operations. We may also use your PHI for other purposes that are permitted and/or required by law and pursuant to your written authorization. The following lists examples of how we may use and/or disclose your PHI. Any other uses not described in this Notice will only be made with your explicit written authorization, which you may revoke at any time by providing us with written notice of your revocation.</p>

      <h3>A. Treatment</h3>
      <p>We may use and disclose your PHI in order to provide you with prescription and supply services. We may disclose your PHI to other pharmacists, pharmacy technicians and health care providers that are involved in your care. You will receive an individual notice and have the opportunity to opt out of any subsidized treatment communications.</p>

      <h3>B. Payment</h3>
      <p>We will use and disclose your PHI in order to obtain payment for the health care services we provide to you. We may also need to disclose your PHI to receive prior approval from your health plan or to determine if your health plan will cover a certain prescription or service.</p>

      <h3>C. Health Care Operations</h3>
      <p>We may use and disclose your PHI in connection with the management of our pharmacy. For example, this may include: quality assessment and improvement, internal compliance audits, and performance evaluations. Additionally, we may use your PHI for our business management and general administrative activities.</p>

      <h3>D. Prescription Refill Reminders, Treatment Alternatives or Health-Related Benefits</h3>
      <p>We may use and disclose your PHI to contact you to remind you about prescription refills, to tell you about treatment options or alternatives, or to inform you about health-related benefits or services that may be of interest to you.</p>

      <h3>E. Family Members, Relatives or Close Friends</h3>
      <p>Unless you object to such disclosure, we may disclose your PHI to your family members, relatives or close personal friends, or any other persons identified by you as being involved in the treatment or payment for your medical care. If you are not present to agree or object to our disclosure of your PHI to a family member, relative or friend, we may exercise our professional judgment to determine whether the disclosure is in your best interest. If we decide to disclose your PHI, we will only disclose the PHI that is relevant to your treatment or payment.</p>

      <h3>F. Other Permitted and Required Uses and Disclosures</h3>
      <p>We may use your PHI without obtaining your authorization and without offering you the opportunity to agree or object as follows:</p>
      <ul>
        <li>as required by law, provided however, that the use or disclosure will be made in compliance with applicable law;</li>
        <li>to a public health authority that is authorized by law to collect or receive such information, or to a foreign government agency that is acting in collaboration with a public health authority and these health activities generally include preventing or controlling disease, reporting deaths, reporting adverse effects of medications or problems with products, notification of communicable disease, and reporting abuse or neglect under certain circumstances;</li>
        <li>to a health oversight agency for oversight activities authorized by law, including audits and inspections, and civil, administrative or criminal investigations, proceedings or actions;</li>
        <li>for judicial or administrative proceedings purposes in response to a subpoena, court order, discovery request, etc. but only if efforts have been made to inform you about the request or to obtain an order protecting the information requested;</li>
        <li>to law enforcement to report certain injuries, comply with court orders or warrants or similar process, to identify a suspect, fugitive, missing person or victim or to report a crime;</li>
        <li>to a coroner or medical examiner to perform duties authorized by law such as identification of a deceased person or determining the cause of death;</li>
        <li>to funeral directors, consistent with applicable law, as necessary to carry out their duties;</li>
        <li>to organ procurement organizations or similar entities for the purpose of facilitating organ, eye or tissue donation and transplantation;</li>
        <li>for research purposes provided that certain approvals take place and assurances are given;</li>
        <li>to avert a serious threat to health or safety, so long as the disclosure is only to a person who is reasonably able to prevent or lessen such threat;</li>
        <li>for military and veterans activities (including foreign military personnel) to assure the proper execution of a military mission and to determine eligibility for benefits;</li>
        <li>for national security and intelligence activities for the purpose of conducting lawful intelligence, counter-intelligence and other national security activities;</li>
        <li>for protection of the President and other authorized persons or foreign heads of state or to conduct authorized investigations;</li>
        <li>to a correctional institution or law enforcement custodian if you are an inmate or under custody; and</li>
        <li>to the extent necessary to comply with laws relating to workers' compensation and work-related injuries.</li>
      </ul>

      <h2>II. Your Rights as Our Patient</h2>
      <p>As our patient, you have a number of rights associated with your PHI. The following describes your specific rights.</p>

      <h3>A. Right to Request Restrictions</h3>
      <p>You have the right to request restrictions or limitations on how we use and/or disclose your PHI, however, we do not have to agree to your requested restriction or limitation (except for transactions you paid for in full out-of-pocket). Your written request must specify: (1) if you would like to restrict or limit our use and/or disclosure; (2) what information you want restricted or limited; and (3) to whom the restriction or limitation applies (e.g., spouse). If we agree to your request, it will not prevent us from disclosing your PHI as follows: (1) to you if you request access or an accounting of disclosures; (2) for purposes required or permitted by law; or (3) in case of an emergency.</p>

      <h3>B. Right to Confidential Communications</h3>
      <p>You have the right to receive confidential communications concerning your PHI by alternative means or via alternative locations. For example, you may want to receive communications related to your prescriptions at a different address other than your home address. If you wish to receive confidential communications via alternative means or locations, please submit your request in writing to the Privacy Officer and set forth the alternative means by which you wish to receive communications or the alternative location at which you wish to receive such communications. We will accommodate all reasonable requests.</p>

      <h3>C. Right to Access and Copy Your PHI</h3>
      <p>You have the right to access, inspect and obtain a copy of your PHI, including any electronic PHI; provided, however, you are not entitled to access certain PHI exempted under HIPAA. To the extent we maintain electronic PHI, upon request we will provide you with a copy of your PHI in the format requested. If we do not have your PHI in our possession, we will provide you with the appropriate contact information when your request is received. If you request a copy of your PHI, you will receive a response to your request in a timely fashion but may be charged a reasonable, cost-based fee to cover copy costs and postage. In some limited circumstances, we may deny your request for access to PHI in which case you may request for the denial to be reviewed. If access is ultimately denied, you are entitled to a written explanation with the reason(s) for the denial.</p>

      <h3>D. Right to an Accounting of Disclosures</h3>
      <p>You have the right to receive an accounting of disclosures of your PHI made by us, including disclosures to or by our business associate(s), for a period of six (6) years prior to the date on which you request an accounting of disclosures, or such lesser period as you indicate. You will receive one request annually free of charge and, thereafter, we may charge you a reasonable, cost-based fee for each subsequent request for an accounting of disclosures within the same twelve-month period. We will notify you of the cost for an accounting of disclosures and you may choose to withdraw or modify your request before we charge you.</p>

      <h3>E. Right to Request Amendments</h3>
      <p>If you believe we have PHI about you that is incorrect or incomplete, you may make a written request to us stating the reasons to support any requested amendment. You have the right to request an amendment to your PHI for so long as we maintain your PHI. If we do not have your PHI in our possession, we will provide you with the appropriate contact information when we receive your request. We will respond to your request for an amendment after we receive your request. However, we may deny your request for amendment if, for example, we determine that the PHI you requested was not created by us or is already accurate and complete. You may respond to our denial by filing a written statement of disagreement, but we have the right to rebut your disagreement. If this occurs, you have the right to request that your original request, our denial, your statement of disagreement, and our rebuttal be included in future disclosures of your PHI.</p>

      <h3>F. Right to a Paper Copy of This Notice</h3>
      <p>You have the right at any time to obtain a paper copy of this Notice, even if you receive this Notice electronically. If you have received an electronic copy of this Notice but wish to obtain a paper copy of this Notice, please send your request in writing to the Privacy Officer at the address listed below.</p>

      <h3>G. Right to Opt Out of Fundraising</h3>
      <p>You have the right to opt-out of fundraising and your PHI will not be used for fundraising purposes or sold without your prior authorization.</p>

      <h2>III. Additional Information / Questions or Complaints</h2>
      <p>If you need any additional information about this Notice or wish to exercise any of your rights set forth in this Notice, please contact the Privacy Officer at the following address:</p>
      <p>
        LegacyRx<br />
        163 Church Rd<br />
        Stockton GA 31649<br />
        United States
      </p>
      <p>If you believe your privacy rights have been violated, you may file a complaint without retaliation with the Privacy Officer of the pharmacy or with:</p>
      <p>
        Secretary of the Department of Health and Human Services<br />
        200 Independence Avenue SW<br />
        Washington D.C. 20201
      </p>
    </LegalPage>
  ),
});
