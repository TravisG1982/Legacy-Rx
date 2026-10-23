import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  adminListPricing,
} from "../lib/pricing.functions";
import { getAdminStatus } from "../lib/admin-access.functions";
import { AdminGate } from "../components/AdminGate";
import { supabase } from "@/integrations/supabase/client";
import type { AdminPricingRow } from "../lib/pricing-types";
import { CouponAdmin } from "../components/CouponAdmin";

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
    if (status.permissions?.manage_coupons) return <div style={{ maxWidth: 1080, margin: "40px auto", padding: 18 }}>
      <button className="btn btn-ghost" onClick={async () => { await supabase.auth.signOut(); await window.location.reload(); }}>Sign out</button>
      <CouponAdmin />
    </div>;
    return <div className="lx-card" style={{ maxWidth: 440, margin: "60px auto" }}>No pricing or coupon permissions are assigned to this account.</div>;
  }
  return <PricingDashboard rows={pricing.rows} loadError={pricing.error} canManageCoupons={status.permissions.manage_coupons} />;
}

type RowState = { value: string; busy: boolean; message: string | null; error: string | null };

function PricingDashboard({
  rows,
  loadError,
  canManageCoupons,
}: {
  rows: AdminPricingRow[];
  loadError: string | null;
  canManageCoupons: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<Record<string, RowState>>({});

  function patch(id: string, next: Partial<RowState>) {
    const base: RowState = { value: "", busy: false, message: null, error: null };
    setState((prev) => ({
      ...prev,
      [id]: { ...base, ...(prev[id] ?? {}), ...next },
    }));
  }


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
          <button className="btn btn-ghost" onClick={() => router.invalidate()}>
            Refresh
          </button>
          <button
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
              {["Product ID", "Product Name", "SKU", "Current Price", "New Price", "Action"].map(
                (h) => (
                  <th key={h} style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rs = state[row.productId];
              return (
                <tr key={row.productId} style={{ borderTop: "1px solid #e7e1d9" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>{row.productId}</td>
                  <td style={{ padding: "10px 12px", minWidth: 260 }}>{row.name || "-"}</td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{row.sku || "-"}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {row.price === null ? "Unavailable" : money(row.price)}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <input
                      inputMode="decimal"
                      placeholder="0.00"
                      value={rs?.value ?? ""}
                      onChange={(e) => patch(row.productId, { value: e.target.value })}
                      disabled
                      style={{
                        width: 110,
                        padding: "8px 10px",
                        border: "1px solid #d8d3cc",
                        borderRadius: 8,
                      }}
                    />
                  </td>
                  <td style={{ padding: "10px 12px", minWidth: 240 }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: "8px 14px" }}
                      disabled
                    >
                      {rs?.busy ? "Updating..." : "Update"}
                    </button>
                    {rs?.message && (
                      <div style={{ color: "#1b6e3c", fontSize: ".8rem", marginTop: 6 }}>
                        {rs.message}
                      </div>
                    )}
                    {rs?.error && (
                      <div style={{ color: "#b3261e", fontSize: ".8rem", marginTop: 6 }}>
                        {rs.error}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {canManageCoupons && <CouponAdmin />}
    </div>
  );
}
