export type LeadStage =
  | "unregistered"
  | "registered"
  | "health_screen"
  | "plan_selection"
  | "added_to_cart"
  | "checkout_contact"
  | "checkout_started"
  | "payment_step"
  | "payment_attempt"
  | "ordered"

  | "not_eligible";

/** Reached the checkout page but never placed an order. */
export const ABANDONED_STAGES: LeadStage[] = [
  "added_to_cart",
  "checkout_contact",
  "checkout_started",
  "payment_step",
  "payment_attempt",
];

export type LeadRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  state: string | null;
  age_18: string | null;
  on_glp1: string | null;
  email_consent: boolean;
  sms_transactional_consent: boolean;
  sms_marketing_consent: boolean;
  stage: LeadStage;
  created_at: string;
  updated_at: string;
  /** Set when this person's email matches a recorded order. */
  order_number?: string | null;
  order_total?: number | null;
};

export const STAGE_LABELS: Record<LeadStage, string> = {
  unregistered: "Unregistered",
  registered: "Registered",
  health_screen: "Health screen",
  plan_selection: "Plan selection",
  added_to_cart: "Added to cart",
  checkout_contact: "Checkout details",
  checkout_started: "Checkout started",
  payment_step: "Payment step",
  payment_attempt: "Card started",
  ordered: "Ordered",

  not_eligible: "Not eligible",
};
