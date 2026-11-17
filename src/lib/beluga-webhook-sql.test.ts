import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
const fingerprint = (payload: object) =>
  createHash("sha256").update(JSON.stringify(payload)).digest("hex");
const base = (masterId: string, event = "FORM_SUBMITTED") => ({ masterId, event });
async function receive(payload: object, environment = "test", digest = fingerprint(payload)) {
  const r = await db.query<{ result: string }>(
    "select public.receive_beluga_webhook($1,$2::jsonb,$3) result",
    [environment, JSON.stringify(payload), digest],
  );
  return r.rows[0].result;
}
async function reserve(id: string, environment = "test", orderId: string | null = null) {
  await db.query(
    "insert into beluga_visits(master_id,environment,test_reference,order_id) values($1,$2,'synthetic',$3)",
    [id, environment, orderId],
  );
}
const rows = async (id: string) =>
  (
    await db.query<{ event: string; possible_duplicate: boolean; payload: object }>(
      "select event,possible_duplicate,payload from beluga_webhook_events where master_id=$1 order by received_at,id",
      [id],
    )
  ).rows;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    "create role service_role bypassrls; create role anon; create role authenticated; create table public.orders(id uuid primary key, status text);",
  );
  // Supabase may grant broad service-role table access through default privileges.
  await db.exec("alter default privileges in schema public grant all on tables to service_role;");
  await db.exec(
    readFileSync("supabase/migrations/20261117120000_beluga_webhook_receiver.sql", "utf8"),
  );
});
afterAll(async () => {
  await db.close();
});

describe("Beluga receipt SQL (real migration, synthetic data)", () => {
  it("retains all identical deliveries, including concurrent requests, with possible-repeat flags", async () => {
    await reserve("repeat");
    const results = await Promise.all(Array.from({ length: 5 }, () => receive(base("repeat"))));
    expect(results.filter((r) => r === "stored")).toHaveLength(1);
    expect(results.filter((r) => r === "possible_duplicate")).toHaveLength(4);
    const saved = await rows("repeat");
    expect(saved).toHaveLength(5);
    expect(saved.filter((r) => r.possible_duplicate)).toHaveLength(4);
  });

  it("receives out-of-order events and different prescriptions without changing orders", async () => {
    const order = "11111111-1111-1111-1111-111111111111";
    await db.query("insert into orders values($1,'paid')", [order]);
    await reserve("ordered", "test", order);
    const payloads = [
      { ...base("ordered", "CONSULT_CONCLUDED"), visitOutcome: "referred" },
      base("ordered"),
      base("ordered", "CONSULT_CANCELED"),
      ...["rx1", "rx2"].map((rxId) => ({
        ...base("ordered", "RX_WRITTEN"),
        docName: "Synthetic",
        medsPrescribed: [
          {
            name: "Synthetic",
            strength: "test",
            refills: "0",
            quantity: "1",
            medId: "test",
            rxId,
            pharmacyNotes: "",
          },
        ],
      })),
    ];
    for (const payload of payloads) expect(await receive(payload)).toBe("stored");
    expect(await rows("ordered")).toHaveLength(5);
    expect((await db.query("select status from orders where id=$1", [order])).rows).toEqual([
      { status: "paid" },
    ]);
  });

  it("rejects cross-environment correlation and requires order-backed live visits", async () => {
    await reserve("test_only");
    expect(await receive(base("test_only"), "live")).toBe("visit_unavailable");
    expect(await rows("test_only")).toHaveLength(0);
    await expect(reserve("bad_live", "live")).rejects.toThrow();
    const order = "22222222-2222-2222-2222-222222222222";
    await db.query("insert into orders values($1,'paid')", [order]);
    await reserve("live_only", "live", order);
    expect(await receive(base("live_only"))).toBe("visit_unavailable");
    expect(await receive(base("live_only"), "live")).toBe("stored");
    await expect(reserve("live_only")).rejects.toThrow();
  });

  it("allows receipt before creation response, but rejects failed and unknown visits", async () => {
    expect(await receive(base("later"))).toBe("visit_unavailable");
    await reserve("later");
    expect(await receive(base("later"))).toBe("stored");
    await db.query("update beluga_visits set creation_status='failed' where master_id='later'");
    expect(await receive(base("later", "CONSULT_CANCELED"))).toBe("visit_unavailable");
    expect(await rows("later")).toHaveLength(1);
  });

  it("rolls back invalid receipt and accepts a corrected retry", async () => {
    await reserve("rollback");
    await expect(receive(base("rollback"), "test", "invalid_digest")).rejects.toThrow();
    expect(await rows("rollback")).toHaveLength(0);
    expect(await receive(base("rollback"))).toBe("stored");
    await expect(
      receive({ ...base("rollback", "CONSULT_CONCLUDED"), visitOutcome: "permanent" }),
    ).rejects.toThrow();
    expect(await rows("rollback")).toHaveLength(1);
  });

  it.each(["anon", "authenticated"])(
    "denies %s table access and receiver execution",
    async (role) => {
      for (const sql of [
        "select * from beluga_visits",
        "select * from beluga_webhook_events",
        "insert into beluga_visits(master_id,environment,test_reference) values('attack','test','qa')",
        `select receive_beluga_webhook('test','{"masterId":"repeat","event":"FORM_SUBMITTED"}', '${"a".repeat(64)}')`,
      ]) {
        await db.exec(`set role ${role}`);
        try {
          await expect(db.exec(sql)).rejects.toThrow(/permission denied/);
        } finally {
          await db.exec("reset role");
        }
      }
      expect(
        (
          await db.query(
            "select relrowsecurity from pg_class where oid in ('beluga_visits'::regclass,'beluga_webhook_events'::regclass)",
          )
        ).rows,
      ).toEqual([{ relrowsecurity: true }, { relrowsecurity: true }]);
    },
  );

  it("grants service role RPC receipt but no direct event mutation", async () => {
    await db.exec("set role service_role");
    try {
      expect(await receive(base("repeat"))).toBe("possible_duplicate");
      expect(await rows("repeat")).toHaveLength(6);
      await expect(db.exec("delete from beluga_webhook_events")).rejects.toThrow(
        /permission denied/,
      );
      await expect(
        db.exec("update beluga_webhook_events set possible_duplicate=false"),
      ).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec("reset role");
    }
  });
});
