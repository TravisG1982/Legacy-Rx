import { toast } from "sonner";

import { writeFunnel } from "./funnel-store";
import { trackFunnelEvent } from "./analytics";
import { saveLeadNow } from "./lead-capture";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Step1Values = {
  state: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age18: string | null;
  onGlp1: string | null;
  emailConsent: boolean;
  emailMarketingConsent: boolean;
  smsConsent: boolean;
  smsMarketing: boolean;
};

export type Step1Errors = Partial<
  Record<
    "state" | "firstName" | "lastName" | "email" | "phone" | "age18" | "onGlp1" | "emailConsent",
    string
  >
>;

const FIELD_ORDER: (keyof Step1Errors)[] = [
  "state",
  "firstName",
  "lastName",
  "email",
  "emailConsent",
  "phone",
  "age18",
  "onGlp1",
];

/** Shared validation so /qualify and the promo landers never drift apart. */
export function validateStep1Fields(v: Step1Values): Step1Errors {
  const e: Step1Errors = {};
  if (!v.state) e.state = "Please select your state.";
  if (!v.firstName.trim()) e.firstName = "First name is required.";
  else if (v.firstName.trim().length > 100) e.firstName = "First name is too long.";
  if (!v.lastName.trim()) e.lastName = "Last name is required.";
  else if (v.lastName.trim().length > 100) e.lastName = "Last name is too long.";
  if (!v.email.trim()) e.email = "Email is required.";
  else if (!EMAIL_RE.test(v.email.trim()) || v.email.trim().length > 255)
    e.email = "Enter a valid email address.";
  const digits = v.phone.replace(/\D/g, "");
  if (!digits) e.phone = "Phone number is required.";
  else if (digits.length !== 10) e.phone = "Enter a valid 10-digit US phone number.";
  if (!v.age18) e.age18 = "Please answer this question.";
  if (!v.onGlp1) e.onGlp1 = "Please answer this question.";
  if (!v.emailConsent)
    e.emailConsent = "Please acknowledge the emails needed for your assessment and order.";
  return e;
}

/** Toasts the first problem and scrolls/focuses the matching field. */
export function focusFirstStep1Error(e: Step1Errors) {
  const key = FIELD_ORDER.find((k) => e[k]);
  if (!key) return;
  toast.error(e[key] as string);
  if (typeof window === "undefined") return;
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-field="${key}"]`) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const focusable = (
      el.matches("input,select,button") ? el : el.querySelector("input,select,button")
    ) as HTMLElement | null;
    focusable?.focus({ preventScroll: true });
  });
}

/** Persists the step-1 answers, records the lead and fires the Meta/GA event. */
export function commitStep1(v: Step1Values, formName = "qualify_step1_free_consultation") {
  writeFunnel({
    contact: {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      email: v.email.trim(),
      phone: v.phone,
      state: v.state,
    },
    answers: {
      consentVersion: 2,
      age18: v.age18,
      onGlp1: v.onGlp1,
      emailConsent: v.emailConsent,
      emailMarketingConsent: v.emailMarketingConsent,
      smsConsent: v.smsConsent,
      smsMarketing: v.smsMarketing,
    },
    latestStep: 2,
  });
  trackFunnelEvent("CompleteRegistration", {
    form_name: formName,
    state: v.state,
    has_email_consent: v.emailConsent,
    has_sms_consent: v.smsConsent,
    has_marketing_sms_consent: v.smsMarketing,
    on_glp1: v.onGlp1,
  });
  saveLeadNow({
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    email: v.email.trim(),
    phone: v.phone,
    state: v.state,
    age18: v.age18,
    onGlp1: v.onGlp1,
    emailConsent: v.emailConsent,
    emailMarketingConsent: v.emailMarketingConsent,
    smsTransactionalConsent: v.smsConsent,
    smsMarketingConsent: v.smsMarketing,
    stage: "health_screen",
  });
}
