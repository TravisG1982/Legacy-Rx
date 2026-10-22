import type { MedKey, Plan } from "./legacyrx-data";
import { MEDS } from "./legacyrx-data";

const KEY = "legacyrx-funnel";

export type FunnelContact = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  state?: string;
};

export type FunnelStep = 1 | 2 | 3;

export type FunnelAnswers = {
  consentVersion?: 2;
  age18?: string | null;
  onGlp1?: string | null;
  emailConsent?: boolean;
  emailMarketingConsent?: boolean;
  smsConsent?: boolean;
  smsMarketing?: boolean;
  none?: boolean;
  conditions?: number[];
  agree?: boolean;
  /** Hormone-program intake summary (free text sent to the doctor). */
  intake?: string;
};

export type FunnelState = {
  med: MedKey;
  plan: Plan["id"];
  contact?: FunnelContact;
  answers?: FunnelAnswers;
  latestStep?: FunnelStep;
  /** Promo code handed out by a campaign lander; pre-filled at checkout. */
  coupon?: string;
};

/**
 * Legacy key: campaign promos used to persist in localStorage, which meant a
 * single offer-page visit discounted every later visit. Promos are now
 * session-scoped only; this key is purged on load.
 */
const LEGACY_PROMO_KEY = "legacyrx-promo";

/** Removes the old cross-visit promo storage so no discount applies by default. */
export function purgeLegacyPromo() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_PROMO_KEY);
  } catch {}
}


/** Drops any campaign promo from this visit (used by landers that sell at full price). */
export function clearPromo() {
  if (typeof window === "undefined") return;
  purgeLegacyPromo();
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FunnelState;
      delete parsed.coupon;
      sessionStorage.setItem(KEY, JSON.stringify(parsed));
    }
  } catch {}
}


export function readFunnel(): FunnelState {
  if (typeof window === "undefined") return { med: "sema", plan: "3" };
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as FunnelState;
  } catch {}
  return { med: "sema", plan: "3" };
}

export function writeFunnel(s: Partial<FunnelState>) {
  if (typeof window === "undefined") return;
  try {
    const prev = readFunnel();
    const merged: FunnelState = {
      ...prev,
      ...s,
      contact: { ...(prev.contact ?? {}), ...(s.contact ?? {}) },
      answers: { ...(prev.answers ?? {}), ...(s.answers ?? {}) },
    };
    sessionStorage.setItem(KEY, JSON.stringify(merged));
  } catch {}
}

export function resolvePlan(s: FunnelState) {
  const med = MEDS[s.med];
  const plan = med.plans.find((p) => p.id === s.plan) ?? med.plans[0];
  return { med, plan };
}
