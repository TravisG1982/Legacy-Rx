// src/lib/fulfill.server.ts — FuzeRx fulfillment steps, driven by Stripe
// payment events and FuzeRx webhooks. Server-only module.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  FuzeRxError,
  fuzerxCreateConsult,
  fuzerxCreateFillRequest,
  fuzerxEnsurePatient,
  fuzerxQuestionnaireId,
} from "./fuzerx.server";
import { CONTRAINDICATIONS, STATE_CODES } from "./legacyrx-data";

export type OrderRow = {
  id: string;
  order_number: string;
  session_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  street: string | null;
  apt: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  medication: string;
  plan_id: string;
  product_id: string;
  product_name: string;
  subtotal: number;
  total: number;
  coupon_code: string | null;
  card_last4: string | null;
  status: string;
  environment: string;
  dob: string | null;
  gender: string | null;
  fuzerx_patient_token: string | null;
  fuzerx_consult_id: string | null;
  fuzerx_fill_request_id: string | null;
  fuzerx_prescription_token: string | null;
  fuzerx_status: string | null;
  fuzerx_last_event: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  [key: string]: unknown;
};

export type MedicalContext = {
  onGlp1?: string | null;
  /** Indices into CONTRAINDICATIONS, or a JSON string of them (from Stripe metadata). */
  conditions?: number[] | string | null;
};

/** Free-text medical history FuzeRx requires on every consult. */
export function standardQuestionsFor(answers?: MedicalContext, medication?: string): {
  medications: string;
  allergies: string;
  conditions: string;
} {
  const hormone = !!medication && medication !== "sema" && medication !== "tirz";
  const label = hormone ? "hormone medication" : "GLP-1 medication";
  const meds = answers?.onGlp1 === "yes" ? `Currently taking a ${label}` : `Not currently taking a ${label}`;
  // Hormone intakes send a free-text summary instead of indices.
  if (typeof answers?.conditions === "string" && answers.conditions && !answers.conditions.trim().startsWith("[")) {
    return { medications: meds, allergies: "None reported", conditions: answers.conditions };
  }
  let indices: number[] = [];
  if (Array.isArray(answers?.conditions)) {
    indices = answers.conditions;
  } else if (typeof answers?.conditions === "string") {
    try {
      const parsed: unknown = JSON.parse(answers.conditions);
      if (Array.isArray(parsed)) indices = parsed.filter((n): n is number => typeof n === "number");
    } catch {
      /* fall through to "None reported" */
    }
  }
  const conditions = indices.length
    ? indices
        .map((i) => CONTRAINDICATIONS[i])
        .filter(Boolean)
        .join("; ")
    : "None reported";
  return { medications: meds, allergies: "None reported", conditions };
}

async function logFailure(order: OrderRow, reason: string) {
  await supabaseAdmin.from("order_failures").insert({
    session_id: order.session_id,
    email: order.email,
    first_name: order.first_name,
    last_name: order.last_name,
    phone: order.phone,
    state: order.state,
    medication: order.medication,
    plan_id: order.plan_id,
    product_id: order.product_id,
    coupon_code: order.coupon_code,
    amount: Number(order.total),
    reason: reason.slice(0, 400),
  });
}

async function patchOrder(id: string, patch: Partial<OrderRow>) {
  // Partial<OrderRow> mirrors the generated Update type; the SDK's excess-
  // property check can't infer it, so cast at the call boundary.
  const { error } = await supabaseAdmin.from("orders").update(patch as never).eq("id", id);
  if (error) console.error("Order update failed.");
}

export async function getOrder(id: string): Promise<OrderRow | null> {
  const { data } = await supabaseAdmin.from("orders").select("*").eq("id", id).maybeSingle();
  return (data as OrderRow) ?? null;
}

export async function getOrderByStripeSession(stripeSessionId: string): Promise<OrderRow | null> {
  const { data } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();
  return (data as OrderRow) ?? null;
}

/** Marks the payment settled and starts the FuzeRx intake. */
export async function startFulfillment(
  order: OrderRow,
  medical?: MedicalContext,
): Promise<OrderRow> {
  if (!order.dob || !order.gender) {
    await patchOrder(order.id, {
      fuzerx_status: "missing_patient_details",
      fuzerx_last_event: "DOB/sex missing from checkout",
    });
    await logFailure(order, "Cannot create FuzeRx intake: DOB or sex missing from checkout.");
    return { ...order, fuzerx_status: "missing_patient_details" };
  }

  const questionnaire = fuzerxQuestionnaireId(order.medication);
  if (!questionnaire) {
    await patchOrder(order.id, {
      fuzerx_status: "awaiting_questionnaire",
      fuzerx_last_event: "FUZERX_QUESTIONNAIRE_ID not configured",
    });
    await logFailure(order, "FuzeRx questionnaire ID not configured (FUZERX_QUESTIONNAIRE_ID) — consult not submitted.");
    return { ...order, fuzerx_status: "awaiting_questionnaire" };
  }

  try {
    const stateCode = order.state ?? "";
    // Checkout stores DOB as MM/DD/YYYY; FuzeRx wants YYYYMMDD.
    const [mm, dd, yyyy] = order.dob.split(/\D+/);
    const dobApi = yyyy && mm && dd
      ? `${yyyy}${mm.padStart(2, "0")}${dd.padStart(2, "0")}`
      : order.dob.replace(/\D/g, "");
    const patientToken = order.fuzerx_patient_token || (await fuzerxEnsurePatient({
      firstName: order.first_name ?? "",
      lastName: order.last_name ?? "",
      gender: order.gender === "female" ? "female" : "male",
      dob: dobApi,
      email: order.email,
      phone: order.phone ?? "",
      street1: [order.street, order.apt].filter(Boolean).join(", "),
      city: order.city ?? "",
      state: STATE_CODES[stateCode] ?? stateCode,
      zip: order.zip ?? "",
    }));

    const { consult } = await fuzerxCreateConsult({
      patientToken,
      firstName: order.first_name ?? "",
      lastName: order.last_name ?? "",
      email: order.email,
      phone: order.phone ?? "",
      street1: [order.street, order.apt].filter(Boolean).join(", "),
      city: order.city ?? "",
      state: stateCode,
      zip: order.zip ?? "",
      questionnaire,
      standardQuestions: standardQuestionsFor(medical, order.medication),
      answers: {},
      metadata: { order_number: order.order_number, product_id: order.product_id },
    });

    await patchOrder(order.id, {
      fuzerx_patient_token: patientToken,
      fuzerx_consult_id: consult,
      status: "consult_sent",
      fuzerx_status: "consult_sent",
      fuzerx_last_event: "Consult submitted to FuzeRx",
    });
    return { ...order, fuzerx_patient_token: patientToken, fuzerx_consult_id: consult, fuzerx_status: "consult_sent" };
  } catch (e) {
    const msg = e instanceof FuzeRxError ? `FuzeRx request failed (${e.status})` : "Consult handoff failed";
    await patchOrder(order.id, { fuzerx_status: "consult_failed", fuzerx_last_event: msg.slice(0, 300) });
    await logFailure(order, `FuzeRx consult failed: ${msg}`);
    return { ...order, fuzerx_status: "consult_failed" };
  }
}

/** Sends an approved prescription to the FuzeRx pharmacy. */
export async function dispatchFill(
  order: OrderRow,
  prescriptionToken: string,
): Promise<OrderRow> {
  try {
    const res = await fuzerxCreateFillRequest({
      patientToken: order.fuzerx_patient_token ?? "",
      prescriptionToken,
      firstName: order.first_name ?? "",
      lastName: order.last_name ?? "",
      phone: order.phone ?? "",
      street1: [order.street, order.apt].filter(Boolean).join(", "),
      city: order.city ?? "",
      state: STATE_CODES[order.state ?? ""] ?? order.state ?? "",
      zip: order.zip ?? "",
      amountCents: Math.round(Number(order.total) * 100),
      stripePayment: {
        cardholderName: [order.first_name, order.last_name].filter(Boolean).join(" ") || order.email,
        lastFourDigits: order.card_last4 ?? "",
        stripeId: order.stripe_payment_intent_id ?? "",
        amountCents: Math.round(Number(order.total) * 100),
        description: `${order.product_name} (${order.order_number})`,
      },
      survey: standardQuestionsFor(),
    });
    await patchOrder(order.id, {
      fuzerx_fill_request_id: res.requestId,
      fuzerx_status: "fill_requested",
      fuzerx_last_event: `Fill request ${res.requestId}`,
    });
    return { ...order, fuzerx_fill_request_id: res.requestId, fuzerx_status: "fill_requested" };
  } catch (e) {
    const msg = e instanceof FuzeRxError ? `FuzeRx request failed (${e.status})` : "Fill handoff failed";
    await patchOrder(order.id, { fuzerx_status: "fill_failed", fuzerx_last_event: msg.slice(0, 300) });
    await logFailure(order, `FuzeRx fill request failed: ${msg}`);
    return { ...order, fuzerx_status: "fill_failed" };
  }
}

/** Finds an order by any FuzeRx identifier carried in a webhook payload. */
export async function findOrderByFuzeRef(ref: {
  consultId?: string | null;
  patientToken?: string | null;
  fillRequestId?: string | null;
}): Promise<OrderRow | null> {
  if (ref.consultId) {
    const { data } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("fuzerx_consult_id", ref.consultId)
      .maybeSingle();
    if (data) return data as OrderRow;
  }
  if (ref.fillRequestId) {
    const { data } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("fuzerx_fill_request_id", ref.fillRequestId)
      .maybeSingle();
    if (data) return data as OrderRow;
  }
  if (ref.patientToken) {
    const { data } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("fuzerx_patient_token", ref.patientToken)
      .maybeSingle();
    if (data) return data as OrderRow;
  }
  return null;
}

/** Refunds the captured payment when the provider rejects the consult. */
export async function releaseOrderPayment(order: OrderRow): Promise<OrderRow> {
  if (!order.stripe_payment_intent_id) {
    await patchOrder(order.id, {
      status: "consult_rejected",
      fuzerx_status: "consult_rejected",
      fuzerx_last_event: "Consult rejected; no payment intent to refund",
    });
    return { ...order, fuzerx_status: "consult_rejected" };
  }
  try {
    const { createStripeClient } = await import("./stripe.server");
    const stripe = createStripeClient(order.environment === "live" ? "live" : "sandbox");
    await stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id });
    await patchOrder(order.id, {
      status: "consult_rejected",
      fuzerx_status: "consult_rejected",
      fuzerx_last_event: "Refunded after provider review rejected the consult",
    });
  } catch {
    console.error("Refund after consult rejection failed.");
    await patchOrder(order.id, {
      fuzerx_status: "consult_rejected",
      fuzerx_last_event: "Consult rejected; refund failed",
    });
    await logFailure(order, "Refund after consult rejection failed");
  }
  return { ...order, fuzerx_status: "consult_rejected" };
}


/** order_failures logger for async payment failures keyed by the Stripe session. */
export async function logOrderFailureByStripeSession(order: OrderRow, reason: string): Promise<void> {
  await logFailure(order, reason);
}
