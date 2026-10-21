// Temporary gate for the retired new-order Stripe checkout. Keep the old
// implementation for historical records; this one switch protects both the
// page and its server function until a replacement flow is approved.
export const LEGACY_STRIPE_CHECKOUT_ENABLED = false;
