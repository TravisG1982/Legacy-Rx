import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "../components/LegalPage";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy - LegacyRx" },
      { name: "description", content: "How LegacyRx collects, uses, discloses, and safeguards your information." },
      { property: "og:title", content: "Privacy Policy - LegacyRx" },
      { property: "og:description", content: "How we handle your personal information." },
    ],
  }),
  component: () => (
    <LegalPage title="Privacy Policy">
      <p>This privacy policy ("Privacy Policy") describes how LegacyRx and/or our owners and/or affiliates (collectively "Company," "our," "we," or "us") collect, use, disclose, and protect information about you provide through the LegacyRx website located at legacyrx.net. (together, the "Site"). This Privacy Policy applies only to information that is collected in connection with your use of the Site. It does not apply to any other offerings, products or services. If you do not want us to collect, use or disclose information about you and your use of the Site as described in this Privacy Policy, then you should not use the Site. By using the Site, you are accepting the practices set out in this Privacy Policy and our <Link to="/terms-of-use">Terms of Use</Link>.</p>

      <p>If you are a resident of California, please see our <Link to="/ccpa-opt-out">California Privacy Notice</Link>.</p>

      <h2>About the Site</h2>
      <p>The Site gathers several types of information from and about users of the Site, including medication information, geographic location and user preferences. Among other things, this allows the Site to:</p>
      <ul>
        <li>Check the prices of your medication at multiple pharmacies near you;</li>
        <li>Show you comparable prices for your medication using information received from third parties;</li>
        <li>Send you a discount card if requested; and</li>
        <li>Provide coupons for your use at the pharmacy of your choice.</li>
      </ul>

      <h2>Categories of Information We Collect</h2>
      <p>The information we collect from or about you allows us to provide our services and helps us personalize and improve your experience on the Site. You may print or download a discount card to use our service without registering with us or creating an account. Depending on how you use the Site, we may collect the following categories of information directly from you:</p>
      <ul>
        <li>Information about medications you are seeking to fill (such as medication names and dosage) and your preferred pharmacy.</li>
        <li>Information about your purchase transactions, including purchases using our discount card, including drug name and pharmacy location.</li>
        <li>Geographic location information from you or your device, including your geolocation data, zip code, region, city, street address, time zone, latitude and longitude information. Please note that we will not access precise geo-location information from your device, unless you grant the Site permission to do so.</li>
        <li>User preferences.</li>
        <li>Technical data and related information, such as information about your device, system and application software, peripherals and other data related to your interactions with the Site.</li>
        <li>Metadata and other information associated with or stored on your device.</li>
        <li>We may also collect information directly from you outside of the Site if you provide it to us, for example, if you send Customer Service a request or email.</li>
        <li>When you use the Site, we automatically collect some categories of information from you, such as information about your use of the Site (e.g., features used, content viewed, dates and times of interactions) and technical data about your device, such as operating system, model, device identifier, and IP address.</li>
        <li>We may also automatically collect certain technical information relating to you, which your web browser automatically sends whenever you visit a website on the Internet, or which is collected when you use a mobile application (see the section "Cookies and Similar Tools" below for more information). For example, we use Google Analytics, a web analytics service provided by Google, Inc. ("Google") to collect information relating to your use of the Site. Google Analytics uses "cookies", which are text files placed on your device, to help us analyze how you use our Site. You can find out more about how Google uses data by visiting "How Google uses information from sites or apps that use our services", located at <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">https://policies.google.com/technologies/partner-sites</a>.</li>
      </ul>

      <h2>How We Use the Information We Collect</h2>
      <p>Information we collect about you may be used for the following purposes:</p>
      <ul>
        <li>Operating the Site, including to provide you the Service features.</li>
        <li>To provide you the information and services you request when you use the Site.</li>
        <li>To customize your experience when you use the Site, for example to provide you with interactive or personalized elements or provide you with content based on your interests, requests, and location.</li>
        <li>Improve the Site and other Company products or services, including by developing new products and services, perform quality control activities, and conduct data analytics.</li>
        <li>Provide account management, patient care, customer service, and engaging in system maintenance.</li>
        <li>Deliver marketing communications, such as promotional materials or advertisements, including materials and advertisements for services offered by us and/or third parties that might be of interest to you, either directly to you or through third party apps or websites.</li>
        <li>Communicate service-related or required notices about the Site to you, which may include communications by email or by text messages (i.e., SMS) at the mobile device number you provide us.</li>
        <li>Detect, prevent, and respond to suspected fraud, intellectual property infringement, violations of our Terms of Use, violations of law, or other misuse of the Site.</li>
        <li>Perform data analytics, including to compile, synthesize, generate and analyze anonymous usage and other aggregated statistics and information.</li>
        <li>Monitor your use of the BIN/PCN/RXGroup/Member ID or other information we provide to you.</li>
        <li>When permitted by applicable law, we may also:
          <ul>
            <li>Combine the information you provide us, or that we collect from third parties, with other information maintained by us, and use that combined information for any of the above purposes.</li>
            <li>De-identify your information by removing information typically used to identify you and use that de-identified information for any purpose permitted by law.</li>
          </ul>
        </li>
      </ul>

      <h2>How We Share Information We Collect</h2>
      <p>Your information may be disclosed to the following third parties:</p>
      <ul>
        <li>Pharmacies and other partners who help us provide the services available through the Site to you.</li>
        <li>Business partners, who may deliver marketing communications, promotional markets, advertisements, or other information, including about other services offered by us and/or third parties, that may be of interest to you. You will be given the option to opt out of marketing messages. If required to do so by law or if we have a good faith belief that disclosure is necessary to (1) comply with the law or with legal process served on us; (2) protect and defend our rights or property; or (3) to protect someone's safety.</li>
        <li>Advisors, potential transactional partners, or other third parties related to the consideration, negotiation, or completion of a corporate change of control resulting from, for example, a sale to, or merger with another entity. If all or substantially all our assets or stock is acquired by a third party, whether by merger, acquisition, reorganization or otherwise, we may transfer our user database, including personal information contained in it, to the third party.</li>
        <li>Service providers who work on our behalf or partner with us to provide or improve the Site or related products or services or carry out activities on our behalf. Our service providers are required to agree to protect your personal information consistent with this Privacy Policy.</li>
      </ul>
      <p><em>Note: All other use case categories exclude text messaging origination opt-in data and consent; this information will not be shared with any third parties.</em></p>
      <p>We and our service providers may share reports on user demographics and traffic patterns that do not identify you, as well as other information that does not identify you with third parties.</p>

      <h2>Information Security</h2>
      <p>We take reasonable steps to protect your personal information, which is any information that identifies you or could reasonably be linked to you. We also use encryption technology, called Secure Sockets Layer (SSL), to help protect personal information in certain areas of our Site during transport across the Internet. The presence of SSL encryption may be indicated by https in the browser URL or the image of a closed lock or solid key in the browser window. These indications may not be present in mobile services that use SSL.</p>
      <p>Unfortunately, there is always some risk that an unauthorized third party may find a way around our security measures. We cannot guarantee that the Internet or any other technical system will be 100% secure or error-free. We are not responsible for the security of information you transmit over networks that we do not control, including the Internet and wireless networks. Please note that e-mails and other communications you send to us are not encrypted, and by communicating with us by email you accept the risk that any personal information contained in the email may be intercepted or accessed by unauthorized parties.</p>

      <h2>Your Choices</h2>
      <p>You may opt out of receiving marketing emails by using the unsubscribe information available in any marketing email, or by emailing us at support@legacyrx.net. To the extent that you use the Site, there are certain messages you may not opt out of receiving, such as non-promotional email messages about programs or services you have registered for or certain administrative, technical, or safety notices about the Site or our products or services.</p>
      <p>The Site does not currently respond to "do not track" signals or other mechanisms that provide a method to opt out of the collection of information over time and across websites and online services you may use. If we do so in the future, we will describe how we do so in this Privacy Policy. Visit the following website, for more information on this developing area. <a href="https://www.allaboutdnt.org" target="_blank" rel="noopener noreferrer">www.allaboutdnt.org</a></p>

      <h2>Information About Minors</h2>
      <p>The Site is intended for adults only and are not directed to, nor do we knowingly collect information from, individuals under the age of 18. If you become aware that your child or any individual under your care who is under the age of 18 has provided us with information without your consent, please contact us at the contact information listed below.</p>

      <h2>California Residents</h2>
      <p>Pursuant to California Civil Code Section 1798.83, if you are a California resident, you have the right to request information about how and to whom we disclose certain categories of your personal information for their direct marketing purposes, once per calendar year. You can make this request to us via email at: support@legacyrx.net. or call us at +1 877 361 8113</p>
      <p>If you are a resident of California, please see our <Link to="/ccpa-opt-out">California Privacy Notice</Link> for additional provisions that apply to you.</p>

      <h2>Links to Other Websites</h2>
      <p>Our Site may include links to external third-party websites and online services that are not under our control. We are not responsible for the collection, use, and disclosure of your information on those websites and other online services provided by those third parties. We encourage you to review the privacy policies and terms of use of each website and other online service you visit. The inclusion of links to external third-party websites and online services does not imply endorsement of, or association with, such websites and online services by us, or any warranty of any kind, either express or implied.</p>

      <h2>Cookies and Similar Tools</h2>
      <p>We use cookies to collect, store and sometimes track information from your computer or mobile device automatically for statistical purposes to improve the Site. If you use our Site, we will use a cookie, web beacons and other similar technologies on our website to save your settings and to provide customizable and personalized services. A cookie is a unique numeric code that we transfer to your computer that lets us know your location, the information visited while on our website and the third-party websites you visited before accessing our website. Web beacons are small pieces of code placed on our website that allow us to obtain information about website usage. We retain the information we receive from the cookies we place on your computer. These cookies do not enable third parties to access any of your personal information. If you prefer not to receive cookies from the Site, then set your browser to refuse all cookies from any websites that you may visit. This will provide you with more control over the acceptance of cookies on your computer. However, it is possibility that some portions of the Site will not function properly or may perform more slowly. By using our Site and not disabling cookies, you consent to their use. Please note that other tracking technologies may still function.</p>

      <h2>Retention</h2>
      <p>We will retain your personal information in accordance with our record retention policies and as permitted by applicable law unless you instruct us to remove it by contact us at <a href="https://legacyrx.net/pages/contact" target="_blank" rel="noopener noreferrer">https://legacyrx.net/pages/contact</a>. We will also retain your personal information as necessary to comply with legal obligations, resolve disputes, and enforce our agreements. You can update the personal information you have provided to us at any time by writing to the program administrator at LegacyRx/Manifest Pharmacy. Attn: Privacy Team/Regulatory Compliance, 163 Church Rd, Stockton GA 31649, United States</p>

      <h2>Access from Outside the United States</h2>
      <p>If you access the Site from outside the United States, please be aware that personal information may be transferred to, stored in, and processed in the United States. Certain governmental authorities may not consider the level of protection of personal information in the United States to be equivalent to that required by the in other jurisdictions.</p>

      <h2>Changes and Updates</h2>
      <p>We may make changes to our Privacy Policy from time to time. When we do so, we will post the revised Privacy Policy on our Site and change the "last updated" date. Please check the "last updated" date at the top of this page to determine if the policy has been modified since you last reviewed it. Your continued use of the Site after that date means you agree to this Privacy Policy and any updates.</p>

      <h2>Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please send them to support@legacyrx.net. or call us at +1 877 361 8113. You may also write to us in care of our administrator at: Attn: Privacy Team/Regulatory Compliance</p>
      <p>
        LegacyRx<br />
        163 Church Rd<br />
        Stockton GA 31649<br />
        United States
      </p>
    </LegalPage>
  ),
});
