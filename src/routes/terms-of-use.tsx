import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "../components/LegalPage";

export const Route = createFileRoute("/terms-of-use")({
  head: () => ({
    meta: [
      { title: "Terms of Use - LegacyRx" },
      { name: "description", content: "Terms governing your access to and use of the LegacyRx website and services." },
      { property: "og:title", content: "Terms of Use - LegacyRx" },
      { property: "og:description", content: "Terms governing your access to and use of LegacyRx." },
    ],
  }),
  component: () => (
    <LegalPage title="Terms Of Use">
      <p>These Terms of Use ("Terms of Use") are applicable to your access to and use of the LegacyRx website located at legacyrx.net (throughout these Terms of Use, and the website may collectively be referred to as the "Site" or may be referred to individually) and any materials, information, products, or services ("Services") provided through the Site operated by or on behalf of LegacyRx and/or our owners and/or affiliates (collectively "Company," "our," "us," or "we") or contracted by LegacyRx and provided by a third party (collectively "Third Party").</p>

      <p>Your access to and use of the Site, and the information and Services available through the Site, are subject to the terms, conditions and notices contained in or referenced in these Terms of Use, as well as any other written agreement between us and you. In addition, when using particular Services on the Site, you will be subject to any posted rules applicable to those Services that may contain terms and conditions in addition to those in these Terms of Use.</p>

      <p>By accessing or using the Site, you agree to these Terms of Use, as updated from time to time. Please read them carefully. If you do not understand or agree to be bound by these Terms of Use, do not access or use the Site or Services. We may revise these Terms of Use at any time and any revisions will take effect immediately upon posting on this Site, unless we state otherwise. Please check this Site periodically for updates.</p>

      <h2>Privacy Policy</h2>
      <p>The LegacyRx <Link to="/privacy-policy">Privacy Policy</Link> and <Link to="/ccpa-opt-out">California Privacy Notice</Link> are part of these Terms of Use and are incorporated into the Terms of Use by this reference. By accepting these Terms of Use, you agree to our collection, use, and disclosure of information as described in the Privacy Policy and California Privacy Notice as modified from time to time. We encourage you to review the Privacy Policy and California Privacy Notice at legacyrx.net/privacy and legacyrx.net/ccpa.</p>

      <h2>Not Medical Advice</h2>
      <p>The contents of the Site and Services are for informational purposes only and are intended to assist you in understanding your health. The content is not intended to be a substitute for professional medical advice, diagnosis, or treatment.</p>
      <p><strong>ALWAYS SEEK THE ADVICE OF YOUR PHYSICIAN OR OTHER QUALIFIED HEALTH PROVIDERS WITH ANY QUESTIONS YOU MAY HAVE REGARDING A MEDICAL CONDITION.</strong></p>
      <p><strong>WE ASSUME NO LIABILITY OR RESPONSIBILITY FOR DAMAGES OR INJURY TO PERSONS OR PROPERTY ARISING FROM ANY USE OF ANY MATERIALS, CONTENTS, PRODUCTS, SUPPLIES, INFORMATION, IDEAS, OR ADVICE CONTAINED IN THE APP, LegacyRx, AND/OR SERVICES.</strong></p>
      <p>You acknowledge and agree that certain Services provided through the Site and Services, depend on information that you input into the Site. We do not recommend or endorse any drug or product or course of treatment.</p>
      <p>We do not recommend or endorse any specific prescription drug or product or health care provider or pharmacy that may be mentioned on the Site. Reliance on any information provided by us, our employees or Third Parties is solely at your own risk. The information provided by the Site and Services is not a basis for diagnosis of any medical condition, disease, or therapy.</p>
      <p><strong>YOU ARE ADVISED TO ALWAYS SEEK THE ADVICE OF YOUR DOCTOR OR OTHER QUALIFIED HEALTHCARE PROVIDER REGARDING ANY MEDICAL CONDITION AND BEFORE STARTING ANY NEW TREATMENT OR ALTERING YOUR EXISTING TREATMENT. THE APP, LegacyRx, AND THE SERVICES ARE NOT INTENDED AS A SUBSTITUTE FOR PROFESSIONAL ADVICE FROM A QUALIFIED HEALTHCARE PROVIDER FAMILIAR WITH YOU AND YOUR UNIQUE MEDICAL HISTORY. YOU UNDERSTAND AND AGREE THAT YOU SHALL NOT DISREGARD PROFESSIONAL MEDICAL ADVICE OR DELAY SEEKING PROFESSIONAL MEDICAL ADVICE BECAUSE OF SOMETHING YOU READ OR LEARNED FROM THE APP, LegacyRx, AND/OR THE SERVICES.</strong></p>

      <h2>Our Services</h2>
      <p>Services offered through the Site are NOT health insurance benefits or policies and are not intended as a substitute for health insurance. By ordering from legacyrx.net you agree that you may not submit a claim for telemedicine services provided to Medicare, any other federal payor, or any state or private payor.</p>
      <p>While there may be a preferred pharmacy used, patient has the ability to direct their prescription to any pharmacy of their choosing. Please email support@legacyrx.net if you would like to use your own pharmacy before completing your order.</p>
      <p>There is no guarantee that a patient will be treated by a provider. As determined by the provider, care or specific treatments may not be appropriate for each patient. Each provider reserves the right to deny care for potential misuse of services or for any other reason if, in the professional judgment of the provider, the provision of services is not medically or ethically appropriate. There is no guarantee that a patient will be issued a prescription and that the decision of whether a prescription is appropriate will be made in the professional judgment of the provider.</p>

      <h2>Important Contact Information by State</h2>

      <h3>Florida Bill of Rights for Weight Loss</h3>
      <p><a href="http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0500-0599/0501/Sections/0501.0575.html" target="_blank" rel="noopener noreferrer">http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&amp;URL=0500-0599/0501/Sections/0501.0575.html</a></p>

      <h3>California Notice to Consumers</h3>
      <p>Medical doctors are licensed and regulated by the Medical Board of California.</p>
      <p>(800) 633-2322<br /><a href="https://www.mbc.ca.gov/" target="_blank" rel="noopener noreferrer">www.mbc.ca.gov</a></p>
      <p>Complaints may be filed online at http://www.mbc.ca.gov/Breeze/Complaints.aspx or submitted in hard copy form. A Consumer Complaint Form, including instructions for completing it, may be found at http://www.mbc.ca.gov/Consumers/Complaints/Submit_By_Mail.aspx. A hard copy Consumer Complaint Form should be submitted to:</p>
      <p>
        Medical Board of California<br />
        Central Complaint Unit<br />
        2005 Evergreen Street, Suite 1200<br />
        Sacramento, CA 95815
      </p>
      <p>The Central Complaint Unit of the Medical Board of California can be contacted by phone at 1-800-633-2322 or 916-263-2382.</p>

      <h3>Texas</h3>
      <p>Complaints about physicians, as well as other licensees and registrants of the Texas Medical Board, including physician assistants, acupuncturists, and surgical assistants may be reported for investigation to:</p>
      <p>
        Texas Medical Board<br />
        Attention: Investigators<br />
        333 Guadalupe, Tower 3, Suite 610<br />
        P.O Box 2018, MC-263<br />
        Austin, TX 78768-2018
      </p>
      <p>Assistance in filing a complaint is available by calling 1-800-201-9353. For more information, visit <a href="https://www.tmb.state.tx.us" target="_blank" rel="noopener noreferrer">www.tmb.state.tx.us</a>.</p>
      <p>Las quejas sobre médicos, asi como sobre otros profesionales acreditados e inscritos del Consejo Médico de Tejas, incluyendo asistentes de médicos, practicantes de acupuntura y asistentes de cirugia, se pueden presentar en la siguiente dirección para ser investigadas:</p>
      <p>Texas Medical Board Attention: Investigations 333 Guadalupe, Tower 3, Suite 610 P.O. Box 2018, MC-263 Austin, Texas 78768-2018</p>
      <p>Si necesita ayuda para presentar una queja, lame al: 1-800-201-9353. Para obtener más información, visite nuestro sitio web en www.tmb.state.tx.us.</p>

      <h3>Kansas</h3>
      <p>It is unlawful for any person who is not licensed under the Kansas Healing Arts Act to open or maintain an office for the practice of the healing arts in this State.</p>
      <p>This office is maintained under the authority of a person who is licensed to practice the healing arts of Kansas.</p>
      <p>Questions and concerns regarding this professional practice may be directed to:</p>
      <p>
        Kansas State Board Of Healing Arts<br />
        800 SW Jackson, Lower Level-Suite A<br />
        Topeka, Kansas 66612<br />
        Phone: (785) 296-7413<br />
        Toll Free: 1 (888) 886-7205<br />
        Fax: (785) 296-0852<br />
        Website: <a href="https://www.ksbha.org" target="_blank" rel="noopener noreferrer">www.ksbha.org</a>
      </p>

      <p>The Site and Services are intended for personal, non-commercial use only. Use of the Services is voluntary.</p>
      <p>You agree that you are responsible for all phone and data charges you incur through the use of the Site.</p>
      <p>We reserve the right to disable the Site or specific features or functionality or make them available to anyone for any reason at any time, without notice or liability to you.</p>
      <p>Upon termination or cancellation, your rights of participation in the Services automatically terminate and you must immediately stop use of the Site and the Services under these Terms of Use. Any sections of these Terms of Use which by their nature are intended to survive, shall survive termination or cancellation.</p>
      <p>You acknowledge and agree that the Services may be provided by Third Parties, including prescriptions by participating pharmacies. We do not guarantee the quality of the Services or products offered by any Third Party, including but not limited to any participating pharmacy, any vendor, or any service provider. Our Site is provided to you in part as a tool to evaluate an estimated price at the time of pricing search for a particular prescription drug. Our Site and Services do not constitute advice on how to manage your overall prescription drug costs or your health.</p>

      <h2>Electronic Communications</h2>
      <p>We may allow you to request and receive pricing information and coupons via communications including, but not limited to, text messaging and email. When you use the Site or send text messages or e-mail to us, you are communicating with us electronically. By using the Services and/or requesting pricing and other information and coupons from us, you are consenting to be contacted with prescription-related information and to receive communications from us electronically by SMS or text messages, emails or by posting notices on the site. SMS consent will not be shared with third party providers. You acknowledge that texting and email are not secure methods of communication and that there may be some risk that the information in the communication(s) could be read by an unauthorized third party. You agree that all agreements, notices, disclosures, and other communications that we provide to you electronically satisfy any legal requirement that such communications be in writing.</p>

      <h2>LegacyRx Intellectual Property</h2>
      <p>All content included in, or made available through, the Site, such as text, graphics, logos, designs, data, button icons, images, audio clips, digital downloads, data compilations, specialized content, technical data, documentation, know-how, and software, along with the compilation of such content, is the property of Company or its content suppliers, is protected by United States and international copyright laws, and may be subject to other intellectual property protections, including patent and trademark rights under United States, other national laws, or international law. All elements of the Site, including without limitation the general design of the Site and the content included therein, are protected by trade dress, copyright, moral rights, trademark, and other laws relating to intellectual property rights. The Site may be used only for the intended purpose for which it is being made available. You may not modify any of the materials and you may not copy, distribute, transmit, display, perform, reproduce, publish, license, create derivative works from, transfer, or sell any information or work contained on the Site. Except as authorized under the copyright laws, you are responsible for obtaining permission before reusing any copyrighted material that is available on the Site. For purposes of these Terms of Use, the use of any such material on any other mobile application, website, or online service is prohibited. You shall comply with all applicable domestic and international laws, statutes, ordinances, and regulations regarding your use of the Site. The Site, their content, and all related rights shall remain the exclusive property of Company or its licensors unless otherwise expressly agreed.</p>
      <p>All custom graphics, icons, logos, design marks and service names are registered trademarks, trademarks or service marks of LegacyRx and its owners. All other trademarks or service marks are property of their respective owners. Nothing in these Terms of Use grants you any right to use any trademark, service mark, logo, and/or the name of LegacyRx.</p>

      <h2>Minors and Use of Service as a Legal Guardian</h2>
      <p>You must be 18 years of age or older to access or use the Site. By using the Site, you represent that you are 18 years of age or older. If you use the Site as the parent or legal guardian on behalf of a minor, you will be fully responsible for complying with these Terms of Use.</p>

      <h2>Your Conduct</h2>
      <p>You agree to comply with all laws, rules, and regulations applicable to your use of the Site. In addition, when using the Site, you agree to:</p>
      <ul>
        <li>Not take any action that interferes with the proper working of the Site, compromises the security of the Site, or otherwise damages the Site or any materials and information available through the Site.</li>
        <li>Not solicit the performance of any illegal activity or other activity that infringes our rights or the rights of others.</li>
        <li>Not attempt to gain unauthorized access to any portion or feature of the Site, to any other systems or networks connected to the Site, to any of our servers, or to any of the Services offered on or through the Site, including but not limited to by hacking, password "mining," or any other unauthorized means.</li>
        <li>Not probe, scan, or test the vulnerability of the Site or any network connected to the Site.</li>
        <li>Not attempt to breach the security or bypass the authentication measures on the Site or any network connected to the Site.</li>
        <li>Not upload or transmit any viruses, files, or programs designed to interrupt, destroy, or limit the functionality of any computer software or hardware or telecommunications equipment to the Site.</li>
        <li>Not use the Site, or any Service or information made available or offered by or through the Site, in any way where the purpose is to reveal any information, other than your own information, or the information of a person in which you are legally authorized under applicable law to manage his or her care (such as a child or parent), or information that we make available to you through the Site.</li>
        <li>Not use any automated means to collect information or content from or otherwise access the Site, including but not limited to through the use of technical tools known as robots, spiders, or scrapers, without our prior permission.</li>
        <li>Provide accurate and current information, and not to provide information that attempts to impersonate another individual.</li>
        <li>Maintain and promptly update such information to keep it accurate and current.</li>
        <li>Be financially responsible for all use of the Site.</li>
        <li>You may not use the Site for any purpose that is unlawful or prohibited by these Terms of Use, or to solicit the performance of any illegal activity or other activity which infringes the rights of Company or others. You agree that we may at any time, and at our sole discretion, terminate your access to the Site without prior notice to you for violating any of the above provisions.</li>
      </ul>

      <h2>Marketing</h2>
      <p>Regardless of whether you have chosen to opt out of certain marketing offers from us, by using the Site you agree that we may market our services and the services of other companies on the Site through the use of banner ads, "hyper-links", and other similar marketing devices. Products offered will be at our sole discretion and may be provided by us and/or companies not affiliated with us. Non-affiliated companies will be solely responsible and liable for the provision of or failure to provide stated services, benefits, or products. We do not legally endorse or guarantee products or services provided by non-affiliated companies.</p>

      <h2>Accuracy of Information</h2>
      <p>We attempt to be as accurate as possible in the provision of the Services made available through the Site. Despite our efforts, the information on the Site and/or provided through the Services may occasionally be inaccurate, incomplete, or out of date. If a price referenced through the Site is not as described, your sole remedy is to accept the correct pricing or forgo the transaction.</p>
      <p><strong>WE MAKE NO REPRESENTATION AS TO THE COMPLETENESS, ACCURACY, OR CURRENCY OF ANY INFORMATION ON THE SITE OR PROVIDED AS PART OF THE SERVICES. YOU ACKNOWLEDGE THAT WE HAVE NO DUTY OR OBLIGATION TO MAINTAIN THE ACCURACY OF, OR UPDATE ANY SUCH INFORMATION, AND AGREE THAT YOUR RELIANCE ON ANY SUCH INFORMATION IS AT YOUR OWN RISK.</strong></p>

      <h2>Links to Other Sites</h2>
      <p>Our Site may include links to external third-party websites and online services that are not under our control. We are not responsible for the collection, use, and disclosure of your information on those websites and other online services provided by those third parties. We encourage you to review the privacy policies and terms of use of each website and other online service you visit. The inclusion of links to external third-party websites and online services does not imply endorsement of, or association with, such websites and online services by us, or any warranty of any kind, either express or implied.</p>

      <h2>Security and Safety</h2>
      <p>You understand that the uploading of information to your mobile device in connection with the App and submitting information to the Site is at your own risk and that we are not responsible for unauthorized access to or use of any personal or other information. All information uploaded to the App may be stored on your mobile device and you understand that the security and safety of your mobile device is your sole responsibility.</p>

      <h2>Disclaimer of Warranties</h2>
      <p><strong>WE PROVIDE ACCESS TO legacyrx.net, THE APP, AND SERVICES, INCLUDING SERVICES PROVIDED BY THIRD PARTIES, "AS IS" AND WITHOUT ANY WARRANTY OR CONDITION, EXPRESS, IMPLIED OR STATUTORY. WE SPECIFICALLY DISCLAIM ANY IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY, AND FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. WE ARE NOT RESPONSIBLE FOR ANY THIRD PARTY SERVICES OR CONDUCT OF PROVIDERS OF THIRD PARTY SERVICES. WE DO NOT WARRANT legacyrx.net, THE APP, AND/OR THE SERVICES WILL BE UNINTERRUPTED OR ERROR FREE. THERE MAY BE DELAYS, OMISSIONS, INTERRUPTIONS, AND INACCURACIES IN THE CONTENT AVAILABLE THROUGH legacyrx.net, THE APP, AND SERVICES. WE DO NOT MAKE ANY REPRESENTATIONS, NOR DO WE ENDORSE THE ACCURACY, COMPLETENESS, TIMELINESS, OR RELIABILITY OF ANY ADVICE, OPINION, STATEMENT, ALERT, NOTIFICATION OR OTHER MATERIAL OR DATA DISPLAYED OR UPLOADED OR DISTRIBUTED THROUGH legacyrx.net, THE APP, AND/OR SERVICES. WE RESERVE THE RIGHT TO CORRECT ANY ERRORS OR OMISSIONS IN legacyrx.net, THE APP, AND SERVICES. WE DO NOT GUARANTEE OR WARRANT THAT legacyrx.net, THE APP, AND/OR SERVICES OR MATERIALS THAT MAY BE DOWNLOADED FROM THE SERVICES DO NOT CONTAIN VIRUSES, WORKS, "TROJAN HORSES" OR OTHER DESTRUCTIVE MATERIALS; WE ARE NOT LIABLE FOR ANY DAMAGES OR HARM ATTRIBUTED TO SUCH FEATURES. IF YOU RELY ON legacyrx.net, THE APP, AND/OR THE SERVICES AND ANY MATERIALS AVAILABLE THROUGH THE SERVICES, YOU DO SO SOLELY AT YOUR OWN RISK. BY USING THIRD PARTY SERVICES, YOU HEREBY WAIVE AND RELEASE ANY CLAIMS AGAINST US FOR ANY AND ALL RESPONSIBILITY OR LIABILITY TO ANY DAMAGE, OR ANY OTHER CLAIM, THAT MAY ARISE IN CONNECTION WITH USAGE OF THE THIRD PARTY SERVICES. YOU ASSUME TOTAL RESPONSIBILITY AND RISK FOR USE OF legacyrx.net, THE APP, AND THE SERVICES OR INFORMATION, AND HYPERLINKED SITES. SERVICES AND INFORMATION PROVIDED BY HYPERLINKED SITES OR THIRD PARTIES MAY BE SUBJECT TO THE ADDITIONAL TERMS AND CONDITIONS OF THOSE PROVIDERS. WE MAKE NO WARRANTY THAT THE SITE OR SERVICE WILL MEET YOUR REQUIREMENTS, OR THAT SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE OR ERROR FREE, NOR DO WE MAKE ANY WARRANTY AS TO THE RESULTS THAT MAY BE OBTAINED FROM THE USE OF THE SERVICE OR AS TO THE ACCURACY OR RELIABILITY OF ANY INFORMATION OBTAINED THROUGH THE SITE OR SERVICE OR THAT ANY DEFECTS WILL BE CORRECTED. WE MAKE NO WARRANTY REGARDING ANY GOODS OR SERVICES PURCHASED THROUGH THE SITE OR THROUGH HYPERLINKED SITES. NO ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED BY YOU FROM US WILL CREATE ANY WARRANTY NOT EXPRESSLY MADE HEREIN.</strong></p>

      <h2>Other Limitations of Liability</h2>
      <p><strong>WE CANNOT AND DO NOT ASSUME ANY LIABILITY FOR UNAUTHORIZED OR FRAUDULENT USE OF legacyrx.net, THE APP, AND SERVICES. BY ACCESSING THE SITE AND SERVICES, YOU AGREE TO HOLD HARMLESS AND WAIVE ALL CLAIMS AGAINST US AND OUR RELATED PARTIES AND THIRD PARTIES REGARDING THE INFORMATION PROVIDED AND YOUR USE OF IT. IN ADDITION, YOU AGREE THAT UNDER NO CIRCUMSTANCES WILL WE OR OUR RELATED PARTIES BE LIABLE TO YOU FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE OR EXEMPLARY DAMAGES – EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES – OR FOR ANY LOSS OF PROFITS OR REVENUE, INCLUDING BUT NOT LIMITED TO LOSS OF SALES, PROFIT, REVENUE, GOODWILL, OR DOWNTIME, (HOWEVER ARISING IN TORT, CONTRACT, OR OTHERWISE) REGARDLESS OF OUR NEGLIGENCE OR WHETHER WE KNEW OR SHOULD HAVE KNOWN OF THE POSSIBILITY OF SUCH DAMAGES. OUR ENTIRE LIABILITY AND YOUR EXCLUSIVE REMEDY WITH RESPECT TO ANY DISPUTE OR CLAIM RELATED TO THE SITE AND SERVICES IS YOUR STOPPING YOUR USE OF THE SITE AND SERVICES. THE LIMITATIONS OF LIABILITY PROVIDED IN THIS AGREEMENT INURE TO THE BENEFIT OF THE COMPANY AND TO ALL OF OUR RESPECTIVE OFFICERS, DIRECTORS, EMPLOYEES, ATTORNEYS AND AGENTS. BECAUSE SOME STATES DO NOT ALLOW THE EXCLUSION OR LIMITATION OF LIABILITY FOR CONSEQUENTIAL OR INCIDENTAL DAMAGES, IN SUCH STATES LIABILITY IS LIMITED TO THE FULLEST EXTENT PERMITTED BY LAW.</strong></p>

      <h2>Indemnification</h2>
      <p><strong>YOU SHALL INDEMNIFY, DEFEND AND HOLD HARMLESS COMPANY AND ITS RESPECTIVE OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS FROM AND AGAINST ALL LOSSES, CLAIMS, LIABILITIES, DEMANDS, COMPLAINTS, ACTIONS, DAMAGES, JUDGMENTS, SETTLEMENTS, FINES, PENALTIES, EXPENSES, AND COSTS (INCLUDING WITHOUT LIMITATION REASONABLE ATTORNEYS' FEES) THAT ARISE OUT OF OR IN CONNECTION WITH (A) YOUR VIOLATION OF APPLICABLE LAWS, (B) YOUR MISUSE OF THE SITE OR SERVICES, AND (C) YOUR BREACH OF THESE TERMS OR ANY OTHER TERMS ON THE SITE. WE RESERVE, AND YOU GRANT TO US, THE EXCLUSIVE RIGHT TO ASSUME THE DEFENSE AND CONTROL OF ANY MATTER SUBJECT TO INDEMNIFICATION BY YOU (SUBJECT TO YOUR CONTINUING INDEMNIFICATION).</strong></p>

      <h2>Dispute Resolution</h2>
      <p>You agree to use the dispute resolution procedures set forth herein with respect to any controversy or claim arising out of or relating to these Terms of Use or their breach. Any dispute between you and Company arising out of or in connection with these Terms of Use will be settled by a binding arbitration in San Diego, California, in accordance with the then-current rules and procedures of Judicial Arbitration and Mediation Services, Inc. (JAMS). The arbitrator will apply the law in accordance with the laws of the State of California. Judgment on the award rendered by the arbitrator may be entered in any court of competent jurisdiction. You agree that, any provision of law notwithstanding, the arbitrator will have the authority to award the prevailing party its costs and reasonable attorneys' fees. Any disputes between you and other users of this Site are not the responsibility of the Company.</p>

      <h2>Changes to These Terms of Use</h2>
      <p>We reserve the right to modify these Terms of Use, in whole or in part, at our own discretion at any time. Modifications shall be effective immediately upon the linking of modified Terms of Use to the Site. Please check the "last updated" date at the top of this page to determine if these Terms of Use have been modified since you last reviewed them. Your continued use of the Site after that date means you agree to these updated Terms of Use.</p>

      <h2>Access or Use Outside the United States</h2>
      <p>Although the Site may be accessed by any user worldwide, the Site and Services are intended only for use by United States residents, are presented solely as a service to visitors and subscribers located in the United States of America ("U.S.") and its territories, and therefore may not comply with legal requirements of foreign countries. LegacyRx and the App are intended for use only by residents of the United States and its territories. Users residing outside of the U.S. and its territories are not permitted to register or to use the Services.</p>

      <h2>Governing Law</h2>
      <p>These Terms of Use are to be governed by and construed in accordance with the laws of the State of Georgia, exclusive of its choice of law rules and matters affecting copyrights, trademarks, and patents under U.S. federal law.</p>

      <h2>Severability</h2>
      <p>If an arbitrator or legal authority determines that any part of these Terms of Use is illegal or unenforceable, then such part will be eliminated, and the remaining Terms of Use will remain in force and effect and continue to apply to your use of the Site and our Services.</p>

      <h2>Entire Agreement</h2>
      <p>These Terms of Use and any documents expressly incorporated by reference constitute the entire agreement between Company and you pertaining to your use of the Site and supersede all prior agreements, representations and warranties, both written and oral with respect to the Site.</p>

      <h2>Operation of the Site</h2>
      <p>We reserve the right to do any of the following, at any time, at our sole discretion, with or without notice, and without any liability to you: (a) modify, suspend, or terminate operation of or your access to the Site, or any portion of the Site, including but not limited to for your violation of these Terms of Use; (b) modify or change the Site, or any portion of the Site; and (c) interrupt the regular operation of the Site, or any portion of the Site, as necessary to perform routine or non-routine maintenance, to correct errors, or to make other changes to the Site.</p>

      <h2>Contact Us</h2>
      <p>If you have any questions or concerns about the Site or these Terms of Use, please contact us at support@legacyrx.net.</p>

      <h2>Digital Millennium Copyright Act ("DMCA") Notice</h2>
      <p>In operating the Site, we may act as a "services provider" (as defined by DMCA) and offer services as an online provider of materials and links to third party websites. As a result, third party materials that we do not own or control may be transmitted, stored, accessed or otherwise made available while using the Site. LegacyRx has in place certain legally mandated procedures regarding allegations of copyright infringement occurring on the Site. We have adopted a policy that provides for the immediate removal of any content or the suspension of any user that is found to have infringed on the rights of legacyrx.net or of a third party, or that has otherwise violated any intellectual property laws or regulations, or any of the terms and conditions of these Terms of Use. If you believe any material available via the Site or Services infringes, specifically or generally upon a copyright, you should notify us using the notice procedure for claimed infringement under the DMCA (17 U.S.C. Sect. 512(c)(2)). We will respond expeditiously to remove or disable access to the material claimed to be infringing upon said copyright and will follow the procedures specified in the DMCA to resolve the claim between the notifying party and the alleged infringer who provided the content. We may give notice to our users of any infringement notice by means of a general notice on any of our websites, electronic mail to a user's e-mail address in our records, or by written communication sent by first-class mail to a user's physical address in our records. If you receive such an infringement notice, you may provide counter-notification in writing to the designated agent that includes the information below. Our designated agent (i.e., proper party for notice) to whom you should address infringement notices under the DMCA is support@legacyrx.net.</p>
    </LegalPage>
  ),
});
