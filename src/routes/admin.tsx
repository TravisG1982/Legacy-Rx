import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  adminListPricing,
} from "../lib/pricing.functions";
import { getAdminStatus } from "../lib/admin-access.functions";
import { AdminGate } from "../components/AdminGate";
import { supabase } from "@/integrations/supabase/client";
import type { AdminPricingRow } from "../lib/pricing-types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Pricing Admin - LegacyRX" },
      { name: "description", content: "Private internal LegacyRX pricing administration." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  loader: async () => {
    const status = await getAdminStatus();
    if (status.state !== "ready" || !status.permissions?.view_pricing) return { status, pricing: null };
    return { status, pricing: await adminListPricing() };
  },
  errorComponent: () => (
    <div style={{ padding: 40, textAlign: "center" }}>Something went wrong loading pricing.</div>
  ),
  component: AdminPage,
});

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function AdminPage() {
  const { status, pricing } = Route.useLoaderData();
  if (status.state !== "ready") return <AdminGate status={status} />;
  if (!status.permissions?.view_pricing || !pricing) {
    return <div className="lx-card" style={{ maxWidth: 440, margin: "60px auto" }}>Pricing access is not assigned to this account.</div>;
  }
  return <PricingDashboard rows={pricing.rows} loadError={pricing.error} />;
}

function PricingDashboard({
  rows,
  loadError,
}: {
  rows: AdminPricingRow[];
  loadError: string | null;
}) {
  const router = useRouter();
  return (
    <div style={{ padding: "28px 18px", maxWidth: 1080, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.4rem", margin: 0 }}>Product Pricing</h1>
          <p className="lx-muted" style={{ margin: "4px 0 0", fontSize: ".85rem" }}>
            Display prices currently come from the LegacyRX catalog in code. Editing is paused until a LegacyRX-controlled pricing source is available.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={() => router.invalidate()}>
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              await supabase.auth.signOut();
              await router.invalidate();
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {loadError && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid #f0c2bd",
            background: "#fdf2f1",
            borderRadius: 8,
            color: "#b3261e",
            fontSize: ".9rem",
          }}
        >
          Could not load current prices: {loadError}
        </div>
      )}

      <div style={{ overflowX: "auto", marginTop: 18 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".9rem" }}>
          <thead>
            <tr style={{ textAlign: "left", background: "var(--cream-warm, #f7f3ee)" }}>
              {["Product ID", "Product Name", "SKU", "Current Price"].map(
                (h) => (
                  <th key={h} scope="col" style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
                <tr key={row.productId} style={{ borderTop: "1px solid #e7e1d9" }}>
                  <th scope="row" style={{ padding: "10px 12px", fontWeight: 700, textAlign: "left" }}>{row.productId}</th>
                  <td style={{ padding: "10px 12px", minWidth: 260 }}>{row.name || "-"}</td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{row.sku || "-"}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {row.price === null ? "Unavailable" : money(row.price)}
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
