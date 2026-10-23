// src/routes/api/public/webhooks/fuzehealth.ts — FuzeRx webhook receiver.
// FuzeRx has no cryptographic webhook signature; access is gated by the
// shared key in the ?key= query parameter (FUZERX_WEBHOOK_KEY).
import { createFileRoute } from "@tanstack/react-router";
import type { OrderRow } from "@/lib/fulfill.server";

type AnyRecord = Record<string, unknown>;

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function safeEventPart(value: string | undefined): string {
  return value && /^[a-z0-9_]{1,40}$/i.test(value) ? value : "unknown";
}

function patchFuze(order: OrderRow, patch: Partial<OrderRow>) {
  return import("@/integrations/supabase/client.server").then(({ supabaseAdmin }) =>
    supabaseAdmin.from("orders").update(patch as never).eq("id", order.id),
  );
}

async function logFuzeFailure(order: OrderRow, reason: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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

const CONSULT_REJECTED_STATES = new Set(["rejected", "cancelled", "canceled"]);

async function handleFuzeWebhook(body: AnyRecord) {
  const { findOrderByFuzeRef, releaseOrderPayment, dispatchFill } = await import("@/lib/fulfill.server");

  const type = str(body['type']) ?? str(body['event']) ?? str(body['webhook_type']) ?? "UNKNOWN";
  const data = ((body['data'] ?? body) as AnyRecord) ?? {};
  const status = (str(data['status']) ?? "").toLowerCase();
  const details = (data['details'] as AnyRecord | undefined) ?? {};
  const state = (str(details['state']) ?? str(data['state']) ?? "").toLowerCase();

  const consultId = str(data['consult']) ?? str(data['consult_id']) ?? str(data['id']);
  const patientToken = str(data['patient_token']) ?? str(data['patientToken']);
  const prescriptionToken = str(data['prescription_token']) ?? str(data['prescriptionToken']);
  const fillRequestId = str(data['request_id']) ?? str(data['fill_request_id']) ?? str(data['order_token']);
  const lastEvent = `${safeEventPart(type)} ${safeEventPart(status || state || "event")}`;

  switch (type.toUpperCase()) {
    case "CONSULT": {
      const order = await findOrderByFuzeRef({ consultId, patientToken });
      if (!order) return;
      if (state === "rx_prescribed" || status === "completed") {
        await patchFuze(order, { fuzerx_status: "prescribed", status: "prescribed", fuzerx_last_event: lastEvent });
        // NOTIFY_RX can land before CONSULT: if a prescription token is
        // already stored, dispatch the fill now that the consult is approved.
        const token = order.fuzerx_prescription_token;
        if (token) {
          await dispatchFill(order, token);
        }
      } else if (CONSULT_REJECTED_STATES.has(state) || CONSULT_REJECTED_STATES.has(status)) {
        const rejected = await releaseOrderPayment(order);
        await patchFuze(rejected, { fuzerx_last_event: lastEvent });
      } else {
        await patchFuze(order, { fuzerx_last_event: lastEvent, fuzerx_status: order.fuzerx_status ?? "consult_sent" });
      }
      return;
    }
    case "NOTIFY_RX": {
      const order = await findOrderByFuzeRef({ patientToken });
      if (!order) return;
      await patchFuze(order, { fuzerx_prescription_token: prescriptionToken ?? null });
      // Dispatch only once the provider has approved the consult.
      if (prescriptionToken && (order.fuzerx_status === "prescribed" || state === "rx_prescribed")) {
        await dispatchFill({ ...order, fuzerx_prescription_token: prescriptionToken }, prescriptionToken);
      }
      return;
    }
    case "ORDER": {
      const order = await findOrderByFuzeRef({ fillRequestId, patientToken });
      if (!order) return;
      if (status === "success" || state === "success") {
        await patchFuze(order, { fuzerx_status: "order_processing", status: "order_processing", fuzerx_last_event: lastEvent });
      } else {
        await patchFuze(order, { fuzerx_status: "order_error", status: "order_error", fuzerx_last_event: lastEvent });
        await logFuzeFailure(order, `FuzeRx order error: ${lastEvent}`);
      }
      return;
    }
    case "SHIPMENT": {
      const order = await findOrderByFuzeRef({ fillRequestId, patientToken });
      if (!order) return;
      if (status === "delivered") {
        await patchFuze(order, { fuzerx_status: "delivered", status: "delivered", fuzerx_last_event: lastEvent });
      } else if (status === "failure" || status === "returned") {
        await patchFuze(order, { fuzerx_status: "shipment_failed", fuzerx_last_event: lastEvent });
        await logFuzeFailure(order, `FuzeRx shipment failure: ${lastEvent}`);
      } else {
        await patchFuze(order, { fuzerx_status: "shipped", status: "shipped", fuzerx_last_event: lastEvent });
      }
      return;
    }
    case "TRIAGE": {
      const order = await findOrderByFuzeRef({ consultId, patientToken });
      if (!order) return;
      await patchFuze(order, { fuzerx_status: "triage", fuzerx_last_event: lastEvent });
      return;
    }
    default: {
      // Unknown type: update the order note when we can match one, else ignore.
      const order = await findOrderByFuzeRef({ consultId, patientToken, fillRequestId });
      if (order) await patchFuze(order, { fuzerx_last_event: lastEvent });
      console.log("Unhandled FuzeRx webhook type.");
    }
  }
}

export const Route = createFileRoute("/api/public/webhooks/fuzehealth")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = new URL(request.url).searchParams.get("key");
        const expected = process.env['FUZERX_WEBHOOK_KEY'];
        if (!expected || key !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const body = (await request.json()) as AnyRecord;
          await handleFuzeWebhook(body);
          return Response.json({ received: true });
        } catch {
          console.error("FuzeRx webhook request failed.");
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
