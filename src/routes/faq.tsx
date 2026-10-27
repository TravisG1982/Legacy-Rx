import { createFileRoute, Link } from "@tanstack/react-router";
import { Faq } from "../components/Faq";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ - LegacyRx" },
      { name: "description", content: "Answers about LegacyRx, the telehealth process, eligibility, pricing, pharmacies, ordering, and returns." },
      { property: "og:title", content: "FAQ - LegacyRx" },
      { property: "og:description", content: "Everything you need to know about LegacyRx." },
    ],
  }),
  component: FaqPage,
});

const ABOUT: [string, string][] = [
  [
    "What is Legacy Rx?",
    "Legacy Rx stands as your all-encompassing health and wellness partner, addressing a wide spectrum of conditions. Our platform facilitates virtual medical consultations and ensures the delivery of high-quality, affordable prescription treatments within the comfort of your home. While specializing in conditions that may cause patient discomfort, Legacy Rx extends its services to acute, subacute, and chronic disease care. Our team of US-based doctors conducts comprehensive patient evaluations and prescribes suitable medication therapies. Legacy Rx envisions extending accessible, top-tier healthcare solutions to individuals and communities across multiple states. With an expanding range of services, we ensure comprehensive care regardless of insurance coverage, all at a fraction of competitors' costs. Explore Legacy Rx' offerings and firsthand experience our swift, complimentary shipping and unmatched online convenience.",
  ],
  [
    "What is the Legacy Rx process?",
    "Choose the therapy required, click on 'Start My Visit,' and respond to a brief set of medical questions. Our team of US-based doctors will thoroughly review your provided information and prescribe medications as necessary. Expect to receive feedback from one of our doctors usually within 1 day. In certain States, a video consultation or live chat will be necessary. If so, one of our doctors will reach out to you to conduct and finalize your consultation using the required method.",
  ],
  [
    "How much does Legacy Rx cost?",
    "If medication therapy is appropriate, you will be able to purchase it through the Legacy Rx platform at far lower costs than other sites and even cheaper than your local pharmacy.",
  ],
];

const OTHER: [string, string][] = [
  [
    "Can I use my health insurance?",
    "We do not accept insurance. We believe an individual's access to quality care should not depend on a third party's opinion. Legacy Rx has removed the barriers traditional insurers can cause and replaced them with transparency and convenience. Our prices for your doctor consultation and medication are industry-leading and oftentimes cheaper than using insurance.",
  ],
  [
    "Is it legal to prescribe medications online?",
    "Yes. Each doctor you interact with is licensed to prescribe medicine and treat patients in the state you live in. This allows you to get the medications you need, on your schedule, hassle-free.",
  ],
  [
    "Can I use my local pharmacy?",
    "Yes. You can choose to use your local pharmacy and our doctors can send your prescription to them. However, the cheapest pricing and most convenient option will be through Legacy Rx's network of affiliated pharmacies. We cannot guarantee drug pricing at your local pharmacy.",
  ],
  [
    "Which pharmacies are you affiliated with?",
    "The following pharmacies may fill your prescription based on the therapy and medication:\n\nManifest Pharmacy\n1018 S. Batesville Road\nGreer, SC 29650\nTel: 888-770-4009\nMonday–Friday 8:00am–5:00pm EST\n\nRX Compounding Store\n8950 SW 74th Court\nSuite 101, Miami, Florida 33156\nTel: 801-477-9444\nMonday–Friday 9:00am–5:00pm EST",
  ],
  [
    "Who is your provider network?",
    "We use MD Integrations - https://mdintegrations.com/",
  ],
  [
    "What doctor network are you affiliated with?",
    "https://mdintegrations.com/",
  ],
  [
    "When will I be charged for my medication?",
    "You will be billed for your medication when the medication is shipped based on the treatment plan you select.",
  ],
  [
    "Is my information safe?",
    "Yes. We take protecting your information seriously. Please read our Privacy Policy for details.",
  ],
  [
    "How old do I have to be to use Legacy Rx?",
    "We treat patients 18 years of age and older. If you are younger than 18 years of age, please seek treatment from a local primary care physician.",
  ],
  [
    "If I'm having an emergency, what should I do?",
    "In case of an emergency please call 9-1-1.",
  ],
  [
    "Why do I need to submit a copy of my photo ID and take a picture of myself?",
    "State regulations require that our medical providers see who we are treating. That is why we may ask you to take a picture of yourself and your photo ID.",
  ],
];

const ORDERING: [string, string][] = [
  [
    "Where does Legacy Rx offer service?",
    "Legacy Rx offers service in the United States only but based on the therapy and medication being prescribed, there may be restrictions based on state. This will be disclosed and confirmed per therapy and as part of the intake process. In the following states - California, Massachusetts, Rhode Island, and Vermont - the following physicians will be assigned to you: Dr Jeffrey Shellenberger and Dr Marc Serota.\n\nRhode Island: Dr Marc Serota MD17024\nVermont: Dr Jeffrey Shellenberger 042.0015585-COMP\nCalifornia: Dr Jeffrey Shellenberger C160558\nMassachusetts: Dr Jeffrey Shellenberger 290752",
  ],
  [
    "Do I need to sign for my order?",
    "No. Your medication will ship via Rush No-Contact delivery, a signature is not required.",
  ],
  [
    "How do I change my credit card?",
    "Card details are entered on the secure payment step and are not stored in your LegacyRX account. For help with a payment method, contact support@legacyrx.net without including card numbers.",
  ],
  [
    "What if I have a problem with my order or my account?",
    "Visit Contact us for the current phone and email options for general order or account support. Please do not include medical details in an ordinary email.",
  ],
  [
    "How long will it take to get my medication?",
    "Once you complete the online visit, you'll hear back from one of our US-based doctors usually within 1 day (some States will require a live chat or video consultation). Orders will then be sent to the dispensing pharmacy and shipped.",
  ],
  [
    "How can I change my shipping address?",
    "Contact support@legacyrx.net as soon as possible to ask about a change. An address cannot be changed after your medication has shipped.",
  ],
];

const RETURNS: [string, string][] = [
  [
    "What is the return policy?",
    "For questions about a refill, cancellation or a change to your plan, contact support@legacyrx.net. We will tell you how your order is handled before any change is made.",
  ],
  [
    "Can I return my medications once I receive them?",
    "Federal and State law do not allow medication returns. Therefore, all sales are final. If you have a specific concern, visit Contact us for the current general support options. Do not send medical details by ordinary email.",
  ],
];

function Section({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div style={{ marginTop: 36 }}>
      <h2 style={{ marginBottom: 16 }}>{title}</h2>
      <Faq items={items} />
    </div>
  );
}

function FaqPage() {
  return (
    <section className="lx">
      <div className="container-lx">
        <div style={{ textAlign: "center" }}>
          <p className="eyebrow">Frequently Asked Questions</p>
          <h1>Everything You Need to Know</h1>
          <p className="lead">
            Answers about Legacy Rx, the telehealth process, eligibility, pricing, pharmacies, ordering, and returns.
          </p>
        </div>
        <div style={{ maxWidth: 820, margin: "20px auto 0" }}>
          <Section title="About" items={ABOUT} />
          <Section title="Other" items={OTHER} />
          <Section title="Ordering" items={ORDERING} />
          <Section title="Returns" items={RETURNS} />
        </div>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <p className="lx-muted">If you don't see your question here, start the assessment and we'll help.</p>
          <Link className="btn btn-primary" to="/qualify">Start assessment</Link>
        </div>
      </div>
    </section>
  );
}
