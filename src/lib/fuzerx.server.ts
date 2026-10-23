// src/lib/fuzerx.server.ts — FuzeRx (rxapi.fuzehealth.com) client helpers.
// Auth: Authorization: ApiKey <key>. Key is the sandbox/production partner key
// held in the FUZERX_API_KEY secret.

// Live FuzeRx API (FuzeHealth confirmed the test environment has no API access).
const FUZERX_BASE = process.env['FUZERX_API_BASE'] || "https://rxapi.fuzehealth.com/v1";

export class FuzeRxError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function fuzerxKey(): string {
  const key = process.env['FUZERX_API_KEY'];
  if (!key) throw new FuzeRxError("FuzeRx API key is not configured", 500);
  return key;
}

async function fuzerxFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${FUZERX_BASE}${path}`, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `ApiKey ${fuzerxKey()}`,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    /* non-JSON error body */
  }
  if (!res.ok) {
    // An upstream error body can include patient or intake fields. Keep only
    // the numeric status in locally stored errors and server logs.
    throw new FuzeRxError("FuzeRx request failed", res.status);
  }
  return json as T;
}

/** FuzeRx patient demographic payload (subset we collect at checkout). */
export type FuzeRxPatientInput = {
  firstName: string;
  lastName: string;
  gender: "male" | "female";
  /** YYYYMMDD */
  dob: string;
  email: string;
  phone: string;
  street1: string;
  city: string;
  state: string; // two-letter code
  zip: string;
};

/** PUT /v1/patient — idempotent by identity; returns the patient token. */
export async function fuzerxEnsurePatient(p: FuzeRxPatientInput): Promise<string> {
  const res = await fuzerxFetch<{ patient_token: string }>("/patient", {
    method: "PUT",
    body: {
      first_name: p.firstName,
      last_name: p.lastName,
      gender: p.gender,
      dob: p.dob,
      street1: p.street1,
      city: p.city,
      state: p.state,
      zip: p.zip,
      phone: p.phone,
      email: p.email,
      species: "HUMAN",
    },
  });
  if (!res.patient_token) throw new FuzeRxError("FuzeRx did not return a patient token", 502);
  return res.patient_token;
}

export type FuzeRxConsultAnswers = Record<string, { values?: string[]; answers?: string[] }>;

/** POST /consults/v0/consult — submits the intake for provider review. */
export async function fuzerxCreateConsult(input: {
  patientToken: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  questionnaire: string;
  standardQuestions: { medications: string; allergies: string; conditions: string };
  answers: FuzeRxConsultAnswers;
  metadata?: Record<string, string>;
}): Promise<{ consult: string; patientToken: string }> {
  const res = await fuzerxFetch<{ consult: string; patient: { patient_token?: string } }>(
    "/consults/v0/consult",
    {
      method: "POST",
      body: {
        patient: [
          {
            first_name: input.firstName,
            last_name: input.lastName,
            preferred_contact: "email",
          },
        ],
        contacts: [{ email: input.email, sms: input.phone }],
        shipping_address: [
          {
            line1: `${input.firstName} ${input.lastName}`.trim(),
            street1: input.street1,
            city: input.city,
            state: input.state,
            zip: input.zip,
          },
        ],
        payment_type: "cash",
        questionnaire: input.questionnaire,
        standard_questions: input.standardQuestions,
        answers: input.answers,
        ...(input.metadata ? { metadata: input.metadata } : {}),
      },
    },
  );
  return {
    consult: res.consult,
    patientToken: res.patient?.patient_token ?? input.patientToken,
  };
}

/** POST /v1/fill_request — sends an approved prescription to the pharmacy. */
export async function fuzerxCreateFillRequest(input: {
  patientToken: string;
  prescriptionToken: string;
  firstName: string;
  lastName: string;
  phone: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  amountCents: number;
  stripePayment: {
    cardholderName: string;
    lastFourDigits: string;
    stripeId: string;
    amountCents: number;
    description: string;
  };
  survey: { allergies: string; medications: string; conditions: string };
}): Promise<{ requestId: string; status: string }> {
  const res = await fuzerxFetch<{ request_id: string; status: string }>("/fill_request", {
    method: "POST",
    body: {
      patient_token: input.patientToken,
      patient_payment_type: "cash",
      address_to_name: `${input.firstName} ${input.lastName}`.trim(),
      street1: input.street1,
      city: input.city,
      state: input.state,
      zip: input.zip,
      phone: input.phone,
      patient_survey: {
        allergies: [input.survey.allergies].filter(Boolean),
        medications: [input.survey.medications].filter(Boolean),
        conditions: [input.survey.conditions].filter(Boolean),
      },
      receipt_items: [
        {
          category: "prescription_cash",
          description: "Paid by patient",
          amount: input.amountCents,
        },
      ],
      stripe_payment: {
        category: "CARD",
        cardholder_name: input.stripePayment.cardholderName,
        last_four_digits: input.stripePayment.lastFourDigits,
        stripe_id: input.stripePayment.stripeId,
        amount: input.stripePayment.amountCents,
        description: input.stripePayment.description,
      },
      medications: [{ prescription_token: input.prescriptionToken }],
      shipping_method: "usps_ground_advantage",
    },
  });
  return { requestId: res.request_id, status: res.status };
}

/** GET /v1/patient/{token}/prescriptions — fallback when NOTIFY_RX is missed. */
export async function fuzerxListPrescriptions(patientToken: string): Promise<
  { prescription_token?: string; medication?: string }[]
> {
  const res = await fuzerxFetch<{ prescriptions?: { prescription_token?: string; medication?: string }[] }>(
    `/patient/${encodeURIComponent(patientToken)}/prescriptions`,
  );
  return res.prescriptions ?? [];
}

/** FuzeRx program (questionnaire) IDs per medication, from the program links FuzeRx shared. */
const PROGRAM_IDS: Record<string, string> = {
  sema: "d046128a-ba07-444c-b142-4ff53ef5a92a", // Weight Management Program
  tirz: "48785fb8-1b82-41f5-92df-1d9a3c73bb5a", // Tirzepatide
};

/** Returns the questionnaire id for this medication, or null until FuzeRx provides it. */
export function fuzerxQuestionnaireId(medication?: string): string | null {
  return (medication && PROGRAM_IDS[medication]) || process.env['FUZERX_QUESTIONNAIRE_ID'] || null;
}
