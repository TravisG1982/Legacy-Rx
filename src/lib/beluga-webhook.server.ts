import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const MAX_BELUGA_BODY_BYTES = 256 * 1024;
const Environment = z.enum(["test", "live"]);
export type BelugaEnvironment = z.infer<typeof Environment>;
const MasterId = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9_-]+$/);
const prescription = z.object({
  name: z.string(),
  strength: z.string(),
  refills: z.string(),
  quantity: z.string(),
  medId: z.string(),
  rxId: z.string(),
  pharmacyNotes: z.string(),
});
// Strip unknown fields, including unagreed event-id/timestamp fields. No identity
// or ordering guarantee can be inferred from the supplied webhook contract.
const Payload = z.discriminatedUnion("event", [
  z.object({ masterId: MasterId, event: z.literal("FORM_SUBMITTED") }),
  z.object({ masterId: MasterId, event: z.literal("CONSULT_CANCELED") }),
  z.object({
    masterId: MasterId,
    event: z.literal("CONSULT_CONCLUDED"),
    visitOutcome: z.enum(["prescribed", "referred"]),
  }),
  z.object({
    masterId: MasterId,
    event: z.literal("RX_WRITTEN"),
    docName: z.string(),
    medsPrescribed: z.array(prescription),
  }),
]);

function reply(status: number, body: Record<string, string | boolean>, headers?: HeadersInit) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}
const unavailable = () => reply(503, { error: "Webhook temporarily unavailable" });
const hash = (value: string) => createHash("sha256").update(value).digest();

function configuration(): { environment: BelugaEnvironment; secret: string } | null {
  if (process.env["BELUGA_WEBHOOK_ENABLED"] !== "true") return null;
  const mode = Environment.safeParse(process.env["BELUGA_WEBHOOK_MODE"]);
  const secret = process.env["BELUGA_WEBHOOK_SECRET"] ?? "";
  if (!mode.success || !/^[A-Za-z0-9_-]{32,256}$/.test(secret)) return null;
  return { environment: mode.data, secret };
}

async function readBody(request: Request): Promise<string | Response> {
  const declared = request.headers.get("content-length");
  if (declared && Number(declared) > MAX_BELUGA_BODY_BYTES) {
    return reply(413, { error: "Payload too large" });
  }
  const reader = request.body?.getReader();
  if (!reader) return reply(400, { error: "Invalid JSON" });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BELUGA_BODY_BYTES) {
        // Do not await cancellation of a potentially uncooperative sender.
        void reader.cancel().catch(() => {});
        return reply(413, { error: "Payload too large" });
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return reply(400, { error: "Invalid JSON" });
  } finally {
    reader.releaseLock();
  }
}

export async function receiveBelugaWebhook(request: Request): Promise<Response> {
  if (request.method !== "POST")
    return reply(405, { error: "Method not allowed" }, { Allow: "POST" });
  try {
    const configured = configuration();
    if (!configured) return unavailable();
    const bearer = request.headers
      .get("authorization")
      ?.match(/^Bearer ([A-Za-z0-9_-]{32,256})$/i)?.[1];
    // Compare fixed-length digests, never log or persist the credential.
    const supplied = hash(bearer ?? "");
    if (!bearer || !timingSafeEqual(hash(configured.secret), supplied))
      return reply(401, { error: "Unauthorized" });
    // One configured mode at a time; the database checks it against the visit.
    const environment = configured.environment;
    if (
      request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !==
        "application/json" ||
      ![null, "identity"].includes(request.headers.get("content-encoding"))
    ) {
      return reply(415, { error: "Unsupported media type" });
    }
    const raw = await readBody(request);
    if (raw instanceof Response) return raw;
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return reply(400, { error: "Invalid JSON" });
    }
    const parsed = Payload.safeParse(json);
    if (!parsed.success) return reply(422, { error: "Invalid webhook payload" });
    // Zod produces a fixed key order. Equal fingerprints are only possible
    // repeats, not proof of event identity; each delivery remains a separate row.
    const fingerprint = hash(JSON.stringify(parsed.data)).toString("hex");
    try {
      const { data, error } = await supabaseAdmin.rpc("receive_beluga_webhook", {
        p_environment: environment,
        p_payload: parsed.data,
        p_fingerprint: fingerprint,
      });
      if (!error && data === "visit_unavailable")
        return reply(503, { error: "Visit not available" });
      if (error || !["stored", "possible_duplicate"].includes(data ?? "")) return unavailable();
    } catch {
      return unavailable();
    }
    return reply(200, { received: true });
  } catch {
    // No payloads, credentials, provider responses or raw exceptions in logs.
    return reply(500, { error: "Internal server error" });
  }
}

// Internal bookkeeping only: no public registration endpoint and no Beluga API
// call. Reserve BEFORE createInitialIntake; a callback may precede its response.
export async function reserveBelugaVisit(input: {
  environment: BelugaEnvironment;
  orderId?: string;
  testReference?: string;
}): Promise<string> {
  const parsed = z
    .object({
      environment: Environment,
      orderId: z.string().uuid().optional(),
      testReference: z
        .string()
        .min(1)
        .max(100)
        .regex(/^[A-Za-z0-9_-]+$/)
        .optional(),
    })
    .refine((v) => (v.environment === "live" ? !!v.orderId : !!(v.orderId || v.testReference)))
    .safeParse(input);
  if (!parsed.success) throw new Error("Invalid Beluga visit reservation.");
  const masterId = `legacyrx_${randomUUID()}`;
  try {
    const { error } = await supabaseAdmin.from("beluga_visits").insert({
      master_id: masterId,
      environment: parsed.data.environment,
      order_id: parsed.data.orderId ?? null,
      test_reference: parsed.data.testReference ?? null,
    });
    if (error) throw new Error("storage failure");
  } catch {
    throw new Error("Beluga visit reservation unavailable.");
  }
  return masterId;
}
