import { upsertFunnelLead } from "./leads.functions";
import type { LeadStage } from "./leads-types";

const SESSION_KEY = "lrx_lead_session";

export function leadSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `s${Date.now()}${Math.random().toString(36).slice(2)}`).replace(/-/g, "");
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export type LeadPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  state?: string;
  age18?: string | null;
  onGlp1?: string | null;
  emailConsent?: boolean;
  smsTransactionalConsent?: boolean;
  smsMarketingConsent?: boolean;
  stage?: LeadStage;
};

async function send(payload: LeadPayload) {
  const sessionId = leadSessionId();
  if (!sessionId) return;
  try {
    await upsertFunnelLead({ data: { sessionId, ...payload } });
  } catch {
    // Lead capture must never block the funnel.
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;
let pending: LeadPayload = {};

/** Debounced save while the visitor is still typing. */
export function saveLeadDebounced(payload: LeadPayload, delay = 800) {
  pending = { ...pending, ...payload };
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    const next = pending;
    pending = {};
    timer = null;
    void send(next);
  }, delay);
}

/** Immediate save, used at stage transitions. */
export function saveLeadNow(payload: LeadPayload) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const next = { ...pending, ...payload };
  pending = {};
  void send(next);
}
