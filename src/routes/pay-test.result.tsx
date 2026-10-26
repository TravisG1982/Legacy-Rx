import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { FunnelShell } from "../components/FunnelShell";
import { getStripeTestOrderStatus } from "../lib/stripe-test-checkout.functions";

export const Route = createFileRoute("/pay-test/result")({
  validateSearch: (s: Record<string, unknown>): { o?: string; t?: string; cancelled?: string } => ({
    o: typeof s.o === "string" ? s.o : undefined,
    t: typeof s.t === "string" ? s.t : undefined,
    cancelled: typeof s.cancelled === "string" ? s.cancelled : undefined,
  }),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Payment status - LegacyRX" },
      { name: "robots", content: "noindex, nofollow" },
      // The page URL carries a private access token; never send it onward.
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: PayTestResult,
});

const MESSAGES: Record<string, string> = {
  pending_payment: "Waiting for the payment result…",
  payment_failed: "The payment did not go through. You can try again.",
  authorized: "The payment was authorized (not yet captured).",
  paid: "Payment received (test mode).",
  abandoned: "This payment was not completed.",
  order_error: "We need to check this order. Please contact support.",
};

function PayTestResult() {
  const { o, t, cancelled } = Route.useSearch();
  const load = useServerFn(getStripeTestOrderStatus);
  const [state, setState] = useState<{ status: string; orderNumber: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!o || !t) {
      setError("This order is not available.");
      return;
    }
    let active = true;
    let tries = 0;
    const tick = async () => {
      try {
        const r = await load({ data: { orderId: o, token: t } });
        if (!active) return;
        setState({ status: r.status, orderNumber: r.orderNumber });
        // The webhook can lag the redirect, so keep checking briefly while still pending.
        if (r.status === "pending_payment" && ++tries < 15) setTimeout(() => void tick(), 2000);
      } catch {
        if (active) setError("This order is not available.");
      }
    };
    void tick();
    return () => {
      active = false;
    };
  }, [o, t, load]);

  return (
    <FunnelShell pct={100} wide>
      <h2 className="qcard-title">Payment status</h2>
      {error ? (
        <p className="qsub" role="alert">{error}</p>
      ) : state ? (
        <>
          <p className="qsub">Order {state.orderNumber}</p>
          <p className="qsub">{cancelled && state.status === "pending_payment" ? "Payment was cancelled." : (MESSAGES[state.status] ?? "Status unavailable.")}</p>
        </>
      ) : (
        <p className="qsub">Loading…</p>
      )}
    </FunnelShell>
  );
}
