import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact-us")({
  head: () => ({
    meta: [
      { title: "Contact Us - LegacyRX" },
      { name: "description", content: "Contact LegacyRX support about your account, billing, orders, or delivery." },
      { property: "og:title", content: "Contact Us - LegacyRX" },
      { property: "og:description", content: "Reach the LegacyRX support team by phone or email." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <section className="lx">
      <div className="container-lx">
        <div className="contact-split">
          <div className="contact-info">
            <p className="eyebrow">Contact</p>
            <h1 className="contact-title">Contact <em>us</em>.</h1>
            <p>For account, payment, order, delivery, and other general support questions.</p>
            <ul className="contact-list">
              <li><span className="ci-ico" aria-hidden="true">&#9742;</span><a href="tel:+18773618113">+1 877 361 8113</a></li>
              <li>
                <span className="ci-ico" aria-hidden="true">&#9993;</span>
                <span>
                  <a href="mailto:support@legacyrx.net">support@legacyrx.net</a>
                  <small style={{ display: "block" }}>For general support only. Do not email symptoms, medical history, treatment details, or other health information.</small>
                </span>
              </li>
              <li><span className="ci-ico" aria-hidden="true">&#9906;</span><span>163 Church Rd,<br />Stockton, GA 31649</span></li>
              <li><span className="ci-ico" aria-hidden="true">&#9201;</span><span><strong>Our customer support hours are:</strong><br />9:00am - 5:00pm, Mon to Fri</span></li>
            </ul>
            <p className="lx-muted">If you need help reaching your care team, ask us without including medical details.</p>
          </div>

          <form className="contact-form" aria-label="Online contact form temporarily unavailable" onSubmit={(event) => event.preventDefault()}>
            <h2>Online message form is temporarily unavailable</h2>
            <p>We are setting up a new delivery channel. For general account, payment, order, or delivery help, please call or email us using the details on this page.</p>
            <p className="lx-muted">Please do not send medical information by email. For medical questions, use the secure channel provided by your care team.</p>
            <fieldset disabled style={{ border: 0, padding: 0, margin: 0, width: "100%" }}>
              <div className="cf-row">
                <div className="field"><label htmlFor="cf-name">Name</label><input id="cf-name" autoComplete="name" /></div>
                <div className="field"><label htmlFor="cf-email">E-mail</label><input id="cf-email" type="email" autoComplete="email" /></div>
              </div>
              <div className="field"><label htmlFor="cf-phone">Phone</label><input id="cf-phone" type="tel" autoComplete="tel" /></div>
              <div className="field"><label htmlFor="cf-message">Message</label><textarea id="cf-message" rows={6} /></div>
              <button type="submit" className="btn btn-primary cf-submit">Submit unavailable</button>
            </fieldset>
          </form>
        </div>
      </div>
    </section>
  );
}
