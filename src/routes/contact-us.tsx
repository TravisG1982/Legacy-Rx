import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { ContactSubject } from "@/lib/contact-topics";
import { CONTACT_SUBJECTS, contactRouteFor, parseContactSubject } from "@/lib/contact-topics";

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
  validateSearch: (search: Record<string, unknown>): { subject?: ContactSubject } => {
    const subject = parseContactSubject(search.subject);
    return subject ? { subject } : {};
  },
  component: ContactPage,
});

function ContactPage() {
  const preselected = Route.useSearch().subject ?? "";
  const [subject, setSubject] = useState<string>(preselected);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setSubject(preselected);
    if (preselected === "medical") setMessage("");
  }, [preselected]);
  const isMedical = contactRouteFor(subject) === "medical";

  function onSubjectChange(next: string) {
    setSubject(next);
    // Drop any text typed under a general subject once medical is chosen.
    if (contactRouteFor(next) === "medical") setMessage("");
  }

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

          <form className="contact-form" aria-label="Contact form (online sending coming soon)" onSubmit={(event) => event.preventDefault()} noValidate>
            <h2>Send us a message</h2>
            <p className="lx-muted">Online sending is still being set up. For help today, please call or email us using the details on this page.</p>
            <div className="cf-warning" role="note">
              <strong>Please do not enter medical information.</strong> Do not share symptoms, diagnoses, treatments, medications, or other health details in this form.
            </div>
            <div className="cf-row">
              <div className="field"><label htmlFor="cf-name">Name</label><input id="cf-name" name="name" autoComplete="name" /></div>
              <div className="field"><label htmlFor="cf-email">Email</label><input id="cf-email" name="email" type="email" autoComplete="email" /></div>
            </div>
            <div className="field"><label htmlFor="cf-phone">Phone</label><input id="cf-phone" name="phone" type="tel" autoComplete="tel" /></div>
            <div className="field">
              <label htmlFor="cf-subject">Subject <span className="req" aria-hidden="true">*</span></label>
              <select id="cf-subject" name="subject" required value={subject} onChange={(event) => onSubjectChange(event.target.value)}>
                <option value="" disabled>Choose a subject</option>
                {CONTACT_SUBJECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            {isMedical && (
              <div className="cf-notice" id="cf-medical-note" role="status">
                Medical questions are handled by the Beluga care team through a secure channel, not through this form. That secure channel is not available here yet.
              </div>
            )}
            <div className="field">
              <label htmlFor="cf-message">Message</label>
              <textarea
                id="cf-message"
                name="message"
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={isMedical}
                aria-describedby={isMedical ? "cf-medical-note" : undefined}
              />
            </div>
            <div className="cf-actions">
              <button type="button" className="btn btn-primary cf-submit" disabled>
                {isMedical ? "Secure medical support — coming soon" : "Send message — coming soon"}
              </button>
              {!isMedical && <p className="lx-muted cf-note-inline">Online sending is being prepared.</p>}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
