import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount } from "@/lib/account.functions";
import { OrderHelp } from "@/components/OrderHelp";
import { orderStatusMessage } from "@/lib/order-status";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My account - LegacyRX" },
      { name: "description", content: "Your LegacyRX orders and their status." },
      { property: "og:title", content: "My account - LegacyRX" },
      { property: "og:description", content: "Your LegacyRX orders and their status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

type Account = Awaited<ReturnType<typeof getMyAccount>>;

function AccountPage() {
  const navigate = useNavigate();
  const load = useServerFn(getMyAccount);
  const [data, setData] = useState<Account | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
                {orderStatusMessage(o.status)}
              </div>
            </div>
          </div>
        ))}
      </div>
      {data && <OrderHelp orderNumbers={data.orders.map((order) => order.order_number)} />}
    </div>
  );
}
