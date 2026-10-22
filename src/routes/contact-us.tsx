import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { submitContactMessage } from "@/lib/contact.functions";

export const Route = createFileRoute("/contact-us")({
  head: () => ({
    meta: [
      { title: "Contact Us - LegacyRX" },
      { name: "description", content: "Contact LegacyRX support about your account, billing, orders, delivery, or other general service questions." },
      { property: "og:title", content: "Contact Us - LegacyRX" },
      { property: "og:description", content: "Reach the LegacyRX support team by phone, email, or message form." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
function newCaptcha() {
  let out = "";
  for (let i = 0; i < 5; i++) out += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  return out;
}

type Errors = Partial<Record<"name" | "email" | "phone" | "message" | "captcha", string>>;

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [txConsent, setTxConsent] = useState(false);
  const [mkConsent, setMkConsent] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null);
  const submissionId = useRef<string | null>(null);

  const refresh = useCallback(() => {
    setCaptcha(newCaptcha());
    setCaptchaInput("");
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let v = e.target.value;
    if (k === "phone") v = v.replace(/[^\d\s()+-]/g, "").slice(0, 20);
    if (k === "name") v = v.slice(0, 120);
    if (k === "email") v = v.slice(0, 255);
    if (k === "message") v = v.slice(0, 4000);
    setForm((f) => ({ ...f, [k]: v }));
    submissionId.current = null;
    setSubmissionNotice(null);
    setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    const name = form.name.trim();
    const digits = form.phone.replace(/\D/g, "");
    if (!name) next.name = "Please enter your name.";
    else if (name.length < 2) next.name = "Please enter your full name.";
    else if (!/^[A-Za-z][A-Za-z\s'.-]*$/.test(name)) next.name = "Name can only contain letters, spaces, apostrophes, and hyphens.";
    if (!form.email.trim()) next.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(form.email.trim())) next.email = "Please enter a valid email address.";
    if (!digits) next.phone = "Please enter your phone number.";
    else if (digits.length !== 10 && !(digits.length === 11 && digits.startsWith("1"))) next.phone = "Enter a 10-digit US phone number.";
    if (!form.message.trim()) next.message = "Please enter a message.";
    else if (form.message.trim().length < 10) next.message = "Please add a little more detail (at least 10 characters).";
    if (!captchaInput.trim()) next.captcha = "Please enter the code shown.";
    else if (captchaInput.trim().toUpperCase() !== captcha) next.captcha = "The code does not match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setStatus("sending");
    try {
      submissionId.current ??= crypto.randomUUID();
      const result = await submitContactMessage({
        data: {
          submissionId: submissionId.current,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
          transactionalConsent: txConsent,
          marketingConsent: mkConsent,
        },
      });
      if (!result.ok) {
        setStatus("error");
        if (result.reason === "medical_details") {
          setSubmissionNotice("Please remove medical details. This form is for general support only.");
          toast.error("This form is for general support only. Please remove medical details.", { duration: 6000 });
        } else if (result.reason === "delivery_pending") {
          setSubmissionNotice("Your message is still being processed. Please check again shortly.");
          toast.error("Your message is still being processed. Please wait before checking again.", { duration: 6000 });
        } else {
          setSubmissionNotice(`Delivery could not be confirmed. Please email support@legacyrx.net without medical details and mention reference ${submissionId.current}. Do not resubmit this message.`);
          toast.error("We couldn't confirm delivery. Please email support@legacyrx.net without medical details. Do not resubmit this message.", { duration: 7000 });
        }
        return;
      }
      setStatus("sent");
      setSubmissionNotice(null);
      submissionId.current = null;
      setForm({ name: "", email: "", phone: "", message: "" });
      setTxConsent(false);
      setMkConsent(false);
      refresh();
      toast.success("The form service accepted your message.", { duration: 5000 });
      setTimeout(() => setStatus("idle"), 5000);
    } catch {
      setStatus("error");
      setSubmissionNotice("We couldn't process your message. Please try again or email support@legacyrx.net without medical details.");
      toast.error("Something went wrong. Please email support@legacyrx.net.", { duration: 5000 });
    }
  }

  return (
    <section className="lx">
      <div className="container-lx">
        <div className="contact-split">
          <div className="contact-info">
            <p className="eyebrow">Contact</p>
            <h1 className="contact-title">
              Contact <em>us</em>.
            </h1>
            <p>For account, payment, order, delivery, and other general support questions.</p>
            <ul className="contact-list">
              <li>
                <span className="ci-ico" aria-hidden="true">&#9742;</span>
                <a href="tel:+18773618113">+1 877 361 8113</a>
              </li>
              <li>
                <span className="ci-ico" aria-hidden="true">&#9993;</span>
                <span>
                  <a href="mailto:support@legacyrx.net">support@legacyrx.net</a>
                  <small style={{ display: "block" }}>For general support only. Do not email symptoms, medical history, treatment details, or other health information.</small>
                </span>
              </li>
              <li>
                <span className="ci-ico" aria-hidden="true">&#9906;</span>
                <span>163 Church Rd,<br />Stockton, GA 31649</span>
              </li>
              <li>
                <span className="ci-ico" aria-hidden="true">&#9201;</span>
                <span>
                  <strong>Our customer support hours are:</strong>
                  <br />9:00am - 5:00pm, Mon to Fri
                </span>
              </li>
            </ul>
            <p className="lx-muted">If you need help reaching your care team, ask us without including medical details.</p>
          </div>

          <form className="contact-form" onSubmit={onSubmit} noValidate>
            <div className="cf-row">
              <div className="field">
                <label htmlFor="cf-name">Name <span className="req">*</span></label>
                <input id="cf-name" value={form.name} onChange={set("name")} className={errors.name ? "invalid" : ""} />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </div>
              <div className="field">
                <label htmlFor="cf-email">E-mail <span className="req">*</span></label>
                <input id="cf-email" type="email" value={form.email} onChange={set("email")} className={errors.email ? "invalid" : ""} />
                {errors.email && <p className="field-error">{errors.email}</p>}
              </div>
            </div>
            <div className="field">
              <label htmlFor="cf-phone">Phone <span className="req">*</span></label>
              <input id="cf-phone" inputMode="tel" placeholder="(000) 000-0000" value={form.phone} onChange={set("phone")} className={errors.phone ? "invalid" : ""} />
              {errors.phone && <p className="field-error">{errors.phone}</p>}
            </div>
            <div className="field">
              <label htmlFor="cf-message">Message <span className="req">*</span></label>
              <textarea id="cf-message" rows={6} value={form.message} onChange={set("message")} aria-describedby="cf-message-note" className={errors.message ? "invalid" : ""} />
              <p className="lx-muted" id="cf-message-note">For general support only. Do not include symptoms, diagnoses, medical history, test results, medication details, or other health information.</p>
              {errors.message && <p className="field-error">{errors.message}</p>}
            </div>

            <label className="cf-consent">
              <input type="checkbox" checked={txConsent} onChange={(e) => { setTxConsent(e.target.checked); submissionId.current = null; setSubmissionNotice(null); }} />
              <span>
                I consent to receive transactional text messages from LegacyRX regarding my account, including reminders
                to complete my signup, order updates, and support messages. Message &amp; data rates may apply. Reply
                STOP to opt out, HELP for help. Consent is not a condition of purchase.
              </span>
            </label>
            <label className="cf-consent">
              <input type="checkbox" checked={mkConsent} onChange={(e) => { setMkConsent(e.target.checked); submissionId.current = null; setSubmissionNotice(null); }} />
              <span>
                I consent to receive marketing text messages from LegacyRX regarding promotions and special offers.
                Message frequency varies. Message and data rates may apply. Reply HELP for assistance or STOP to opt
                out.
              </span>
            </label>
            <p className="cf-note">Mobile information will not be sold or shared with third parties.</p>
            <p className="cf-links">
              <Link to="/privacy-policy">Privacy Policy</Link>
              <span aria-hidden="true">|</span>
              <Link to="/terms-of-use">Terms of Use</Link>
              <span aria-hidden="true">|</span>
              <Link to="/sms-terms-and-conditions">SMS Terms and Conditions</Link>
            </p>

            <div className="field">
              <label>Please verify that you are human <span className="req">*</span></label>
              <div className="captcha-box">
                <div className="captcha-code" aria-label={`Captcha code ${captcha.split("").join(" ")}`}>{captcha}</div>
                <button type="button" className="captcha-refresh" aria-label="Refresh captcha" onClick={refresh}>&#8635;</button>
              </div>
              <input
                aria-label="Enter the captcha code"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value.slice(0, 8))}
                placeholder="Enter the code above"
                className={errors.captcha ? "invalid" : ""}
                style={{ marginTop: 10 }}
              />
              {errors.captcha && <p className="field-error">{errors.captcha}</p>}
            </div>

            <button type="submit" className="btn btn-primary cf-submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : status === "sent" ? "Message sent" : "Submit"}
            </button>
            {submissionNotice && <p className="field-error" role="alert">{submissionNotice}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
