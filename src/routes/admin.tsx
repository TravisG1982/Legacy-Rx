import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  adminListPricing,
  adminLogin,
  adminLogout,
  adminUpdatePricing,
} from "../lib/pricing.functions";
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
  loader: () => adminListPricing(),
  errorComponent: () => (
    <div style={{ padding: 40, textAlign: "center" }}>Something went wrong loading pricing.</div>
  ),
  component: AdminPage,
});

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function AdminPage() {
  const data = Route.useLoaderData();
  const router = useRouter();

  if (!data.authenticated) return <LoginCard onDone={() => router.invalidate()} />;

  return <PricingDashboard rows={data.rows} loadError={data.error} />;
}

function LoginCard({ onDone }: { onDone: () => void }) {
  const login = useServerFn(adminLogin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await login({ data: { username, password } });
      if (!res.ok) setError("Incorrect username or password.");
      else onDone();
    } catch {
      setError("Sign-in failed. Please try again.");
    }
    setBusy(false);
  }

  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24 }}>
      <form
        onSubmit={submit}
        className="lx-card"
        style={{ width: "100%", maxWidth: 380, display: "grid", gap: 12 }}
      >
        <h1 style={{ fontSize: "1.3rem", margin: 0 }}>Pricing Admin</h1>
        <p className="lx-muted" style={{ margin: 0, fontSize: ".9rem" }}>
          Authorized staff only.
        </p>
        <label style={{ display: "grid", gap: 4, fontSize: ".85rem", fontWeight: 600 }}>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            style={{ padding: "10px 12px", border: "1px solid #d8d3cc", borderRadius: 8 }}
          />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: ".85rem", fontWeight: 600 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{ padding: "10px 12px", border: "1px solid #d8d3cc", borderRadius: 8 }}
          />
        </label>
        {error && <div style={{ color: "#b3261e", fontSize: ".85rem" }}>{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

type RowState = { value: string; busy: boolean; message: string | null; error: string | null };

function PricingDashboard({
  rows,
  loadError,
}: {
  rows: AdminPricingRow[];
  loadError: string | null;
}) {
  const router = useRouter();
  const update = useServerFn(adminUpdatePricing);
  const logout = useServerFn(adminLogout);
  const [state, setState] = useState<Record<string, RowState>>({});

  function patch(id: string, next: Partial<RowState>) {
    const base: RowState = { value: "", busy: false, message: null, error: null };
    setState((prev) => ({
      ...prev,
      [id]: { ...base, ...(prev[id] ?? {}), ...next },
    }));
  }


  async function submit(row: AdminPricingRow) {
    const raw = state[row.productId]?.value ?? "";
    const price = Number(raw);
    if (!raw.trim() || !Number.isFinite(price) || price <= 0) {
      patch(row.productId, { error: "Enter a valid price.", message: null });
      return;
    }
    patch(row.productId, { busy: true, error: null, message: null });
    try {
      const res = await update({ data: { productId: row.productId, price } });
      if (!res.ok) {
        patch(row.productId, { busy: false, error: res.error ?? "Update failed." });
        return;
      }
      if (!("verified" in res) || !res.verified) {
        patch(row.productId, {
          busy: false,
          error: ("error" in res && res.error) || "Update not verified by the pricing API.",
        });
        await router.invalidate();
        return;
      }
      patch(row.productId, {
        busy: false,
        value: "",
        message: `Updated and verified: ${money(res.persisted!)}`,
      });
      await router.invalidate();
    } catch (err) {
      patch(row.productId, { busy: false, error: (err as Error).message });
    }
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
              await logout();
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
      <CouponAdmin />
    </div>
  );
}
