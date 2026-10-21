import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { isMedKey, MEDS } from "@/lib/legacyrx-data";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createPortalSession, getMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My account - LegacyRX" },
      { name: "description", content: "Your LegacyRX orders, plan status and billing." },
      { property: "og:title", content: "My account - LegacyRX" },
      { property: "og:description", content: "Your LegacyRX orders, plan status and billing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

type Account = Awaited<ReturnType<typeof getMyAccount>>;

const STATUS: Record<string, string> = {
  paid: "Paid — with provider",
  refunded: "Refunded",
  abandoned: "Not completed",
  payment_failed: "Payment failed",
};

function AccountPage() {
  const navigate = useNavigate();
  const load = useServerFn(getMyAccount);
  const portal = useServerFn(createPortalSession);
  const [data, setData] = useState<Account | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sub =
    data?.subscriptions.find((s) => ["active", "trialing", "past_due"].includes(s.status)) ??
    data?.subscriptions[0];

  useEffect(() => {
    load().then(setData, () => setErr("Could not load your account. Please try again later."));
  }, [load]);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setErr("Could not sign out. Please try again.");
      return;
    }
    void navigate({ to: "/" });
  }

  async function manage() {
    if (!sub) return;
    setBusy(true);
    try {
      const r = await portal({
        data: { subscriptionId: sub.stripe_subscription_id, returnUrl: window.location.href },
      });
      if ("error" in r) return setErr(r.error);
      window.open(r.url, "_blank", "noopener");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not open billing.");
    } finally {
      setBusy(false);
    }
  }

  const fmt = (d?: string | null) =>
    d
      ? new Date(d).toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: "0 16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.6rem", margin: 0 }}>My account</h1>
          <p className="lx-muted" style={{ margin: "4px 0 0" }}>
            {data?.email}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
      {err && <p style={{ marginTop: 16 }}>{err}</p>}

      <div className="co-box" style={{ marginTop: 20, padding: 20 }}>
        <h2 style={{ fontSize: "1.1rem", margin: "0 0 8px" }}>My plan</h2>
        {!data && !err ? (
          <p className="lx-muted">Loading…</p>
        ) : data && !sub ? (
          <p className="lx-muted">No active plan on this account.</p>
        ) : sub ? (
          <>
            <p style={{ margin: "0 0 4px" }}>
              <b>{isMedKey(sub.medication) ? MEDS[sub.medication].name : "Treatment"} monthly</b> —{" "}
              {sub.status === "canceled"
                ? "canceled"
                : sub.cancel_at_period_end
                  ? `cancels on ${fmt(sub.current_period_end)}`
                  : sub.status === "past_due"
                    ? "payment due — please update your card"
                    : `next charge ${fmt(sub.current_period_end)}`}
            </p>
            {sub.status !== "canceled" && (
              <button
                className="btn btn-primary"
                style={{ marginTop: 10 }}
                disabled={busy}
                onClick={() => void manage()}
              >
                {busy ? "Opening…" : "Manage billing / cancel"}
              </button>
            )}
          </>
        ) : null}
      </div>

      <div className="co-box" style={{ marginTop: 16, padding: 20 }}>
        <h2 style={{ fontSize: "1.1rem", margin: "0 0 8px" }}>Orders</h2>
        {data && data.orders.length === 0 && <p className="lx-muted">No orders yet.</p>}
        {data?.orders.map((o) => (
          <div
            key={o.order_number}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              padding: "10px 0",
              borderTop: "1px solid var(--border, #eee)",
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{o.product_name}</div>
              <div className="lx-muted" style={{ fontSize: ".8rem" }}>
                #{o.order_number} · {fmt(o.created_at)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div>${Number(o.total).toFixed(2)}</div>
              <div className="lx-muted" style={{ fontSize: ".8rem" }}>
                {STATUS[o.status] ?? o.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
