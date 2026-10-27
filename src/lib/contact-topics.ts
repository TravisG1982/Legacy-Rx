/**
 * Subjects for the /contact-us form. Each subject maps to a future route:
 * "general" topics go to a support delivery channel, "medical" goes to
 * Beluga's secure patient channel. Neither route is connected yet, so the
 * form can show both but never sends.
 */
export const CONTACT_SUBJECTS = [
  { value: "account", label: "A question about my account", route: "general" },
  { value: "payment", label: "A question about payment or billing", route: "general" },
  { value: "order", label: "A question about my order", route: "general" },
  { value: "delivery", label: "A question about shipping or delivery", route: "general" },
  { value: "support", label: "General support or website help", route: "general" },
  { value: "medical", label: "Medical question", route: "medical" },
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]["value"];
export type ContactRoute = (typeof CONTACT_SUBJECTS)[number]["route"];

export function contactRouteFor(subject: string): ContactRoute | null {
  return CONTACT_SUBJECTS.find((s) => s.value === subject)?.route ?? null;
}

/** Validates the `?subject=` search param so links can preselect a topic. */
export function parseContactSubject(value: unknown): ContactSubject | undefined {
  return CONTACT_SUBJECTS.find((s) => s.value === value)?.value;
}
