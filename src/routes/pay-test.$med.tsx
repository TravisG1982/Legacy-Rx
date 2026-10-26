import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { FunnelShell } from "../components/FunnelShell";
import { readFunnel } from "../lib/funnel-store";
import { MEDS, isMedKey, type Plan } from "../lib/legacyrx-data";
import { createStripeTestPayment } from "../lib/stripe-test-checkout.functions";

export const Route = createFileRoute("/pay-test/$med")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Test payment - LegacyRX" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PayTestPage,
});

function PayTestPage() {
  const { med } = Route.useParams();
  const start = useServerFn(createStripeTestPayment);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clicked = useRef(false);

  if (!isMedKey(med)) return <FunnelShell pct={90}><p className="qsub">Unknown treatment.</p></FunnelShell>;
  const funnel = readFunnel();
  const email = funnel.contact?.email;
  const plan: Plan["id"] = MEDS[med].plans.some((p) => p.id === funnel.plan) ? funnel.plan : MEDS[med].plans[0]!.id;
  const planInfo = MEDS[med].plans.find((p) => p.id === plan)!;

  async function pay() {
    // A second click while the first is in flight must not start a second payment.
    if (clicked.current || !email || !isMedKey(med)) return;
    clicked.current = true;
    setBusy(true);
    setError(null);
    try {
      const { url } = await start({ data: { med, plan, email } });
      window.location.assign(url);
    } catch (e) {
      clicked.current = false;
      setBusy(false);
      setError(e instanceof Error ? e.message : "We could not start the payment.");
    }
  }

  return (
    <FunnelShell pct={90} wide>
      <p className="qsub" style={{ background: "#fff4e5", padding: 8, borderRadius: 6 }}>
        <strong>Test mode.</strong> No real payment is taken. Use card 4242 4242 4242 4242, any future date, any CVC.
      </p>
      <h2 className="qcard-title" style={{ marginBottom: 6 }}>Pay for your order</h2>
      <p className="qsub" style={{ marginBottom: 16 }}>
        {MEDS[med].name} · {planInfo.label}. The amount is set by LegacyRX when you continue, not by this page.
      </p>
      <p className="qsub">Sign in with the verified QA account approved for this test before continuing. <Link to="/auth">Sign in</Link></p>
      {!email ? (
        <p className="qsub" role="alert">Complete the assessment first. <Link to="/qualify">Start assessment</Link></p>
      ) : (
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void pay()}>
          {busy ? "Opening secure payment…" : "Continue to test payment"}
        </button>
      )}
      {error && <p className="qsub" role="alert" style={{ marginTop: 12 }}>{error}</p>}
    </FunnelShell>
  );
}
