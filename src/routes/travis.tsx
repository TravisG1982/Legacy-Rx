import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  authorizeLeadExport,
  deleteFunnelLeads,
  listFunnelLeads,
} from "../lib/leads.functions";
import { getAdminStatus } from "../lib/admin-access.functions";
import { AdminGate } from "../components/AdminGate";
import { supabase } from "@/integrations/supabase/client";
import { ABANDONED_STAGES, STAGE_LABELS, type LeadRow } from "../lib/leads-types";

export const Route = createFileRoute("/travis")({
  head: () => ({
    meta: [
      { title: "Funnel Leads - LegacyRX" },
      { name: "description", content: "Private internal view of LegacyRX funnel leads." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  loader: async () => {
    const status = await getAdminStatus();
    if (status.state !== "ready" || !status.permissions?.view_leads) return { status, leads: [] as LeadRow[] };
    const result = await listFunnelLeads();
    return { status, leads: result.leads };
  },
  errorComponent: () => (
    <div style={{ padding: 40, textAlign: "center" }}>Something went wrong loading leads.</div>
  ),
  component: TravisPage,
});

type Preset =
  | "today"
  | "yesterday"
  | "today_yesterday"
  | "last7"
  | "last14"
  | "last28"
  | "last30"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "max";

const PRESETS: [Preset, string][] = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["today_yesterday", "Today and yesterday"],
  ["last7", "Last 7 days"],
  ["last14", "Last 14 days"],
  ["last28", "Last 28 days"],
  ["last30", "Last 30 days"],
  ["this_week", "This week"],
  ["last_week", "Last week"],
  ["this_month", "This month"],
  ["last_month", "Last month"],
  ["max", "Maximum"],
];

const TZ = "America/New_York";

// Offset (ms) between the given instant's wall clock in EST and UTC.
function estOffsetMs(t: Date) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(t)
    .reduce<Record<string, string>>((a, x) => {
      a[x.type] = x.value;
      return a;
    }, {});
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour) % 24,
    Number(p.minute),
    Number(p.second),
  );
  return asUtc - t.getTime();
}

// Midnight EST for a given calendar date (y/m/d), returned as a real instant.
function estMidnight(y: number, m: number, d: number) {
  const guess = Date.UTC(y, m, d, 12, 0, 0);
  const off = estOffsetMs(new Date(guess));
  return new Date(Date.UTC(y, m, d) - off);
}

// Interpret a calendar-picked date (local y/m/d) as that day at midnight EST.
function startOfDay(d: Date) {
  return estMidnight(d.getFullYear(), d.getMonth(), d.getDate());
}

// Today in EST, as midnight EST.
function estToday() {
  const now = new Date();
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [y, m, d] = p.split("-").map(Number);
  return estMidnight(y, m - 1, d);
}

// Add n EST days to an EST-midnight instant (DST safe).
function addDays(d: Date, n: number) {
  const shifted = new Date(d.getTime() + n * 86400000);
  const off = estOffsetMs(shifted);
  const local = new Date(shifted.getTime() + off);
  return estMidnight(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
}

function estParts(d: Date) {
  const off = estOffsetMs(d);
  const local = new Date(d.getTime() + off);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth(),
    day: local.getUTCDate(),
    weekday: local.getUTCDay(),
  };
}

function rangeFor(preset: Preset): { from: Date | null; to: Date | null } {
  const today = estToday();
  const endToday = addDays(today, 1);
  const tp = estParts(today);

  switch (preset) {
    case "today":
      return { from: today, to: endToday };
    case "yesterday":
      return { from: addDays(today, -1), to: today };
    case "today_yesterday":
      return { from: addDays(today, -1), to: endToday };
    case "last7":
      return { from: addDays(today, -6), to: endToday };
    case "last14":
      return { from: addDays(today, -13), to: endToday };
    case "last28":
      return { from: addDays(today, -27), to: endToday };
    case "last30":
      return { from: addDays(today, -29), to: endToday };
    case "this_week": {
      const from = addDays(today, -tp.weekday);
      return { from, to: endToday };
    }
    case "last_week": {
      const thisWeek = addDays(today, -tp.weekday);
      return { from: addDays(thisWeek, -7), to: thisWeek };
    }
    case "this_month":
      return { from: estMidnight(tp.year, tp.month, 1), to: endToday };
    case "last_month":
      return {
        from: estMidnight(tp.year, tp.month - 1, 1),
        to: estMidnight(tp.year, tp.month, 1),
      };

    default:
      return { from: null, to: null };
  }
}

const box: React.CSSProperties = {
  border: "1px solid var(--line, #e4ded6)",
  borderRadius: 12,
  background: "#fff",
};

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "warn" | "good";
}) {
  const bg = tone === "warn" ? "#fdeceb" : tone === "good" ? "#e8f7ee" : "#f1f4f8";
  const fg = tone === "warn" ? "#a3271f" : tone === "good" ? "#15803d" : "#475569";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: ".76rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
        background: bg,
        color: fg,
      }}
    >
      {children}
    </span>
  );
}

function TravisPage() {
  const data = Route.useLoaderData();
  // Stop Microsoft Clarity recording on this private dashboard.
  useEffect(() => {
    const w = window as unknown as { clarity?: (cmd: string) => void };
    try {
      w.clarity?.("stop");
    } catch {
      /* noop */
    }
  }, []);
  if (data.status.state !== "ready") return <AdminGate status={data.status} />;
  if (!data.status.permissions?.view_leads) return <div className="lx-card" style={{ maxWidth: 440, margin: "60px auto" }}>Lead access is not assigned to this account.</div>;
  return <LeadsDashboard leads={data.leads} canDelete={data.status.permissions.delete_leads} />;
}

const EST_TZ = "America/New_York";

function fmt(dt: string) {
  const d = new Date(dt);
  const date = d.toLocaleDateString("en-GB", { timeZone: EST_TZ });
  const time = d.toLocaleTimeString("en-GB", { timeZone: EST_TZ, hour12: false });
  return `${date}, ${time}`;
}

function LeadsDashboard({ leads: initialLeads, canDelete }: { leads: LeadRow[]; canDelete: boolean }) {
  const router = useRouter();
  const removeLeads = useServerFn(deleteFunnelLeads);
  const fetchLeads = useServerFn(listFunnelLeads);
  const checkExport = useServerFn(authorizeLeadExport);
  const [leads, setLeads] = useState<LeadRow[]>(initialLeads);
  const [exportError, setExportError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [preset, setPreset] = useState<Preset>("last30");
  const [custom, setCustom] = useState<DateRange | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [abandonedOnly, setAbandonedOnly] = useState(false);
  const [salesOnly, setSalesOnly] = useState(false);

  // Always hits the server (POST + cache-busting stamp), so newly arrived leads show up.
  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetchLeads({ data: { t: Date.now() } });
      if (!res.unlocked) {
        await router.invalidate();
        return;
      }
      setLeads(res.leads);
    } catch {
      await router.invalidate();
    } finally {
      setRefreshing(false);
    }
  }

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<Preset | null>("last30");
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(undefined);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const today = useMemo(() => startOfDay(new Date()), []);

  const rangeLabel = useMemo(() => {
    if (custom?.from) {
      const a = format(custom.from, "dd/MM/yyyy");
      const b = custom.to ? format(custom.to, "dd/MM/yyyy") : a;
      return a === b ? a : `${a} - ${b}`;
    }
    return PRESETS.find((p) => p[0] === preset)?.[1] ?? "Last 30 days";
  }, [preset, custom]);

  const rows = useMemo(() => {
    let from: Date | null;
    let to: Date | null;
    if (custom?.from) {
      from = startOfDay(custom.from);
      to = addDays(startOfDay(custom.to ?? custom.from), 1);
    } else {
      const r = rangeFor(preset);
      from = r.from;
      to = r.to;
    }
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      const t = new Date(l.created_at).getTime();
      if (from && t < from.getTime()) return false;
      if (to && t >= to.getTime()) return false;
      // "Abandoned checkout" = reached the cart or details step but never paid.
      if (abandonedOnly && !ABANDONED_STAGES.includes(l.stage)) return false;
      // "Sales" = a matched, paid order.
      if (salesOnly && !l.order_number) return false;
      if (!q) return true;
      const name = `${l.first_name ?? ""} ${l.last_name ?? ""}`.toLowerCase();
      return name.includes(q) || (l.email ?? "").toLowerCase().includes(q);
    });
  }, [leads, preset, custom, search, abandonedOnly, salesOnly]);



  const salesRows = useMemo(() => rows.filter((r) => r.order_number), [rows]);
  const salesCount = salesRows.length;
  const salesValue = useMemo(
    () => salesRows.reduce((sum, r) => sum + (r.order_total ?? 0), 0),
    [salesRows],
  );

  const visibleIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const selectedVisible = useMemo(
    () => visibleIds.filter((id) => selected.has(id)),
    [visibleIds, selected],
  );
  const allSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(() => (allSelected ? new Set() : new Set(visibleIds)));
  }

  async function handleDelete() {
    const ids = selectedVisible;
    if (ids.length === 0) return;
    const ok = window.confirm(
      `Delete ${ids.length} lead${ids.length === 1 ? "" : "s"}? This cannot be undone.`,
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await removeLeads({ data: { ids } });
      setSelected(new Set());
      await refresh();
    } finally {
      setDeleting(false);
    }
  }

  function openPicker() {
    setPendingPreset(custom?.from ? null : preset);
    setPendingRange(custom);
    setPickerOpen(true);
  }

  function applyPicker() {
    if (pendingRange?.from) {
      setCustom(pendingRange);
    } else if (pendingPreset) {
      setPreset(pendingPreset);
      setCustom(undefined);
    }
    setPickerOpen(false);
  }

  const pendingLabel = pendingRange?.from
    ? `${format(pendingRange.from, "dd/MM/yyyy")}${
        pendingRange.to && startOfDay(pendingRange.to).getTime() !== startOfDay(pendingRange.from).getTime()
          ? ` - ${format(pendingRange.to, "dd/MM/yyyy")}`
          : ""
      }`
    : (PRESETS.find((p) => p[0] === (pendingPreset ?? preset))?.[1] ?? "");

  // Highlight the selected preset's dates on the calendar (ranges are end-exclusive).
  const calendarRange: DateRange | undefined = pendingRange?.from
    ? pendingRange
    : (() => {
        const r = rangeFor(pendingPreset ?? preset);
        if (!r.from || !r.to) return undefined;
        return { from: r.from, to: addDays(startOfDay(r.to), -1) };
      })();

  async function exportCsv() {
    setExportError(null);
    try {
      await checkExport();
    } catch {
      setExportError("Could not verify export access. Refresh and try again.");
      await router.invalidate();
      return;
    }
    const header = [
      "Received (EST)",
      "First name",
      "Last name",
      "Email",
      "Phone",
      "State",
      "18+",
      "On GLP-1",
      "Dropped off at",
      "Order number",
      "Order total",
      "Email consent",
      "SMS transactional",
      "SMS marketing",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      header.map(esc).join(","),
      ...rows.map((l) =>
        [
          fmt(l.created_at),
          l.first_name,
          l.last_name,
          l.email,
          l.phone,
          l.state,
          l.age_18,
          l.on_glp1,
          STAGE_LABELS[l.stage] ?? l.stage,
          l.order_number ?? "",
          l.order_total != null ? l.order_total.toFixed(2) : "",
          l.email_consent ? "yes" : "no",
          l.sms_transactional_consent ? "yes" : "no",
          l.sms_marketing_consent ? "yes" : "no",
        ]
          .map(esc)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `legacyrx-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleLock() {
    await supabase.auth.signOut();
    await router.invalidate();
  }

  const th: React.CSSProperties = {
    textAlign: "left",
    padding: "12px 14px",
    fontSize: ".8rem",
    color: "#64748b",
    fontWeight: 600,
    borderBottom: "1px solid #eee7de",
    whiteSpace: "nowrap",
  };
  const td: React.CSSProperties = {
    padding: "14px",
    fontSize: ".88rem",
    borderBottom: "1px solid #f2ece4",
    verticalAlign: "middle",
  };

  return (
    <div style={{ padding: "28px 20px 60px", maxWidth: 1400, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <strong style={{ fontSize: "1rem" }}>
          {rows.length} lead{rows.length === 1 ? "" : "s"} · {rangeLabel}
          {salesCount > 0 && (
            <span style={{ marginLeft: 10, color: "#15803d" }}>
              · {salesCount} sale{salesCount === 1 ? "" : "s"} · ${salesValue.toFixed(2)}
            </span>
          )}
        </strong>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", position: "relative" }}>
          <input
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <button
            type="button"
            className={salesOnly ? "btn btn-primary" : "btn btn-ghost"}
            onClick={() => { setSalesOnly((v) => !v); setAbandonedOnly(false); }}
          >
            Sales only
          </button>
          <button
            type="button"
            className={abandonedOnly ? "btn btn-primary" : "btn btn-ghost"}
            onClick={() => { setAbandonedOnly((v) => !v); setSalesOnly(false); }}
          >
            Abandoned checkout
          </button>

          <button type="button" className="btn btn-ghost" onClick={() => (pickerOpen ? setPickerOpen(false) : openPicker())}>

            Range: {rangeLabel}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void exportCsv()}>
            Export CSV
          </button>
          <button type="button" className="btn btn-ghost" onClick={refresh} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleLock}>
            Lock
          </button>

          {pickerOpen && (
            <div
              style={{
                ...box,
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                zIndex: 30,
                width: "min(92vw, 760px)",
                boxShadow: "0 12px 36px rgba(0,0,0,.14)",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <div
                  style={{
                    borderRight: "1px solid #f0eae2",
                    padding: 12,
                    minWidth: 190,
                    maxHeight: 380,
                    overflow: "auto",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 8, fontSize: ".85rem", color: "#64748b" }}>
                    Presets
                  </div>
                  <div style={{ display: "grid", gap: 2 }}>
                    {PRESETS.map(([id, label]) => {
                      const active = pendingPreset === id && !pendingRange?.from;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setPendingPreset(id);
                            setPendingRange(undefined);
                          }}
                          style={{
                            textAlign: "left",
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: 0,
                            cursor: "pointer",
                            background: active ? "#eef6f8" : "transparent",
                            fontWeight: active ? 600 : 400,
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 300, padding: 6 }}>
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    defaultMonth={calendarRange?.from ?? today}
                    selected={calendarRange}
                    onSelect={(r) => {
                      setPendingRange(r);
                      if (r?.from) setPendingPreset(null);
                    }}
                    disabled={{ after: today }}
                    className="pointer-events-auto"
                  />
                </div>
              </div>
              <div
                style={{
                  borderTop: "1px solid #f0eae2",
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span className="lx-muted" style={{ fontSize: ".9rem" }}>
                  {pendingLabel}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setPickerOpen(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={applyPicker}>
                    Update
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {exportError && <p role="alert" style={{ color: "#b3261e" }}>{exportError}</p>}

      <p className="lx-muted" style={{ fontSize: ".85rem", margin: "10px 0 16px" }}>
        Leads are saved as soon as someone starts typing. Those who never completed step 1 show "Unregistered".
      </p>

      {canDelete && selectedVisible.length > 0 && (
        <div
          style={{
            ...box,
            padding: "10px 14px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <strong style={{ fontSize: ".9rem" }}>{selectedVisible.length} selected</strong>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDelete}
            disabled={deleting}
            style={{ background: "#a3271f", borderColor: "#a3271f" }}
          >
            {deleting ? "Deleting..." : "Delete selected"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setSelected(new Set())}>
            Clear selection
          </button>
        </div>
      )}

      <div style={{ ...box, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 44 }}>
                <input
                  type="checkbox"
                  aria-label="Select all leads"
                  checked={allSelected}
                  onChange={toggleAll}
                  style={{ width: 16, height: 16 }}
                />
              </th>
              <th style={th}>Received (EST)</th>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Phone</th>
              <th style={th}>State</th>
              <th style={th}>18+</th>
              <th style={th}>On GLP-1</th>
              <th style={th}>Dropped off at</th>
              <th style={th}>Order</th>
              <th style={th}>Consents</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td style={{ ...td, textAlign: "center", color: "#94a3b8" }} colSpan={11}>
                  No leads in this range.
                </td>
              </tr>
            )}
            {rows.map((l) => (
              <tr key={l.id} style={selected.has(l.id) ? { background: "#fbf7f2" } : undefined}>
                <td style={td}>
                  <input
                    type="checkbox"
                    aria-label="Select lead"
                    checked={selected.has(l.id)}
                    onChange={() => toggleOne(l.id)}
                    style={{ width: 16, height: 16 }}
                  />
                </td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>{fmt(l.created_at)}</td>
                <td style={td}>{`${l.first_name ?? ""} ${l.last_name ?? ""}`.trim() || "-"}</td>
                <td style={td}>{l.email || "-"}</td>
                <td style={td}>{l.phone || "-"}</td>
                <td style={td}>{l.state || "-"}</td>
                <td style={td}>{l.age_18 || "-"}</td>
                <td style={td}>{l.on_glp1 || "-"}</td>
                <td style={td}>
                  <Badge
                    tone={
                      l.stage === "ordered"
                        ? "good"
                        : l.stage === "unregistered" || l.stage === "not_eligible"
                          ? "warn"
                          : "default"
                    }
                  >
                    {STAGE_LABELS[l.stage] ?? l.stage}
                  </Badge>
                </td>
                <td style={td}>
                  {l.order_number ? (
                    <div style={{ display: "grid", gap: 2, justifyItems: "start" }}>
                      <span style={{ fontWeight: 600 }}>{l.order_number}</span>
                      {l.order_total != null && (
                        <span style={{ color: "#15803d", fontSize: ".82rem" }}>
                          ${l.order_total.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="lx-muted">-</span>
                  )}
                </td>
                <td style={td}>
                  <div style={{ display: "grid", gap: 4, justifyItems: "start" }}>
                    {l.email_consent && <Badge>Email</Badge>}
                    {l.sms_transactional_consent && <Badge>SMS Tx</Badge>}
                    {l.sms_marketing_consent && <Badge>SMS Mkt</Badge>}
                    {!l.email_consent && !l.sms_transactional_consent && !l.sms_marketing_consent && (
                      <span className="lx-muted">-</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
