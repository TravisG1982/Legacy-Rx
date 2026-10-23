import type { LeadStage } from "./leads-types";

export const STAGES: LeadStage[] = [
  "unregistered",
  "registered",
  "health_screen",
  "plan_selection",
  "added_to_cart",
  "checkout_contact",
  "checkout_started",
  "payment_step",
  "payment_attempt",
  "ordered",

  "not_eligible",
];
