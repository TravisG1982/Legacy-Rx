import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  adminDeleteCoupon,
  adminListCoupons,
  adminSaveCoupon,
  type AdminCoupon,
} from "@/lib/coupons-admin.functions";
import { MED_KEYS, MEDS, type MedKey } from "@/lib/legacyrx-data";

const EMPTY = { code: "", type: "percent" as AdminCoupon["type"], amount: "", expires: "", maxUses: "", meds: [...MED_KEYS] as MedKey[] };
const TYPE_LABEL: Record<AdminCoupon["type"], string> = {
  percent: "% off",
  fixed: "$ off",
  fixed_total: "Set total to $",
};
const cell = { padding: "8px 10px" } as const;
const input = { padding: "8px 10px", border: "1px solid #d8d3cc", borderRadius: 8 } as const;

export function CouponAdmin() {
  const list = useServerFn(adminListCoupons);
  const save = useServerFn(adminSaveCoupon);
  const del = useServerFn(adminDeleteCoupon);
  const [rows, setRows] = useState<AdminCoupon[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () => list().then(setRows, (e: Error) => setMsg(e.message));
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setMsg(null);
    try {
      await fn();
      setMsg(ok);
      await refresh();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  function toPayload(c: AdminCoupon) {
    return { id: c.id, code: c.code, type: c.type, amount: Number(c.amount), active: c.active, expires_at: c.expires_at, max_uses: c.max_uses, meds: c.meds as MedKey[] };
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const meds = form.meds;
    await run(
      () =>
        save({
          data: {
            code: form.code,
            type: form.type,
            amount: Number(form.amount),
            active: true,
            expires_at: form.expires ? new Date(form.expires + "T23:59:59").toISOString() : null,
            max_uses: form.maxUses ? Number(form.maxUses) : null,
            meds,
          },
        }),
      `Code ${form.code} created.`,
    );
    setForm(EMPTY);
  }

  return (
    <div style={{ marginTop: 40 }}>
      <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Discount codes</h2>
      <p className="lx-muted" style={{ margin: "4px 0 14px", fontSize: ".85rem" }}>
        Customers enter these at payment. Discounts apply to the first payment only; monthly renewals are charged at the regular price.
      </p>
      <form onSubmit={create} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input style={input} required placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <select style={input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AdminCoupon["type"] })}>
          {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input style={{ ...input, width: 90 }} required inputMode="decimal" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <label style={{ fontSize: ".85rem" }}>Expires <input style={input} type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} /></label>
        <input style={{ ...input, width: 100 }} inputMode="numeric" placeholder="Max uses" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
        {MED_KEYS.map((k) => (
          <label key={k} style={{ fontSize: ".85rem" }}>
            <input
              type="checkbox"
              checked={form.meds.includes(k)}
              onChange={(e) => setForm({ ...form, meds: e.target.checked ? [...form.meds, k] : form.meds.filter((m) => m !== k) })}
            />{" "}
            {MEDS[k].name}
          </label>
        ))}
        <button className="btn btn-primary" style={{ padding: "8px 14px" }}>Add code</button>
      </form>
      {msg && <p style={{ fontSize: ".85rem", marginTop: 10 }}>{msg}</p>}
      <div style={{ overflowX: "auto", marginTop: 14 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".9rem" }}>
          <thead>
            <tr style={{ textAlign: "left", background: "var(--cream-warm, #f7f3ee)" }}>
              {["Code", "Discount", "Medications", "Expires", "Used", "Status", ""].map((h) => <th key={h} style={cell}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} style={{ borderTop: "1px solid #e7e1d9" }}>
                <td style={{ ...cell, fontWeight: 700 }}>{c.code}</td>
                <td style={cell}>{c.type === "percent" ? `${c.amount}% off` : c.type === "fixed" ? `$${c.amount} off` : `Total $${c.amount}`}</td>
                <td style={cell}>{c.meds.join(", ")}</td>
                <td style={cell}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}</td>
                <td style={cell}>{c.uses}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                <td style={cell}>{c.active ? "On" : "Off"}</td>
                <td style={{ ...cell, whiteSpace: "nowrap" }}>
                  <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => run(() => save({ data: { ...toPayload(c), active: !c.active } }), `${c.code} turned ${c.active ? "off" : "on"}.`)}>
                    {c.active ? "Turn off" : "Turn on"}
                  </button>{" "}
                  <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => { if (confirm(`Delete ${c.code}?`)) void run(() => del({ data: { id: c.id } }), `${c.code} deleted.`); }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
