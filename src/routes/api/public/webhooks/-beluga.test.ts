import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

const { rpc, insert } = vi.hoisted(() => ({ rpc: vi.fn(), insert: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { rpc, from: vi.fn(() => ({ insert })) },
}));
import { Route } from "./beluga";
import { MAX_BELUGA_BODY_BYTES, reserveBelugaVisit } from "@/lib/beluga-webhook.server";

const handler = (
  Route.options.server!.handlers as {
    ANY: (args: { request: Request }) => Promise<Response>;
  }
).ANY;
const SECRET = "synthetic_" + "a".repeat(40);
const WRONG_SECRET = "other_" + "b".repeat(40);
const base = { masterId: "legacyrx_synthetic", event: "FORM_SUBMITTED" };
const rx = {
  masterId: base.masterId,
  event: "RX_WRITTEN",
  docName: "Synthetic Doctor",
  medsPrescribed: [
    {
      name: "Synthetic",
      strength: "test",
      refills: "0",
      quantity: "1",
      medId: "synthetic",
      rxId: "N/A",
      pharmacyNotes: "",
    },
  ],
};
function request(
  payload: unknown = base,
  options: { method?: string; secret?: string; headers?: HeadersInit; raw?: string } = {},
) {
  const method = options.method ?? "POST";
  return new Request("https://example.test/api/public/webhooks/beluga", {
    method,
    headers: {
      authorization: `Bearer ${options.secret ?? SECRET}`,
      "content-type": "application/json",
      ...options.headers,
    },
    ...(method === "GET" || method === "HEAD"
      ? {}
      : { body: options.raw ?? JSON.stringify(payload) }),
  });
}
const send = (req: Request) => handler({ request: req });

beforeEach(() => {
  rpc.mockReset().mockResolvedValue({ data: "stored", error: null });
  insert.mockReset().mockResolvedValue({ error: null });
  vi.stubEnv("BELUGA_WEBHOOK_ENABLED", "true");
  vi.stubEnv("BELUGA_WEBHOOK_SECRET", SECRET);
  vi.stubEnv("BELUGA_WEBHOOK_MODE", "test");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Beluga receiver", () => {
  it.each([
    base,
    { ...base, event: "CONSULT_CANCELED" },
    rx,
    { ...base, event: "CONSULT_CONCLUDED", visitOutcome: "prescribed" },
    { ...base, event: "CONSULT_CONCLUDED", visitOutcome: "referred" },
  ])("durably receives the documented payload $event", async (payload) => {
    const response = await send(request(payload));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(rpc).toHaveBeenCalledWith("receive_beluga_webhook", {
      p_environment: "test",
      p_payload: payload,
      p_fingerprint: createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
    });
  });

  it.each(["test", "live"])(
    "uses the same secret and explicit %s mode, never payload mode/environment",
    async (mode) => {
      vi.stubEnv("BELUGA_WEBHOOK_MODE", mode);
      const other = mode === "test" ? "live" : "test";
      const response = await send(request({ ...base, mode: other, environment: other }));
      expect(response.status).toBe(200);
      expect(rpc).toHaveBeenCalledWith("receive_beluga_webhook", {
        p_environment: mode,
        p_payload: base,
        p_fingerprint: createHash("sha256").update(JSON.stringify(base)).digest("hex"),
      });
    },
  );

  it("does not read or store an unauthorized body", async () => {
    for (const authorization of ["", `Basic ${SECRET}`, "Bearer wrong", `Bearer ${WRONG_SECRET}`]) {
      const req = request(base, { headers: { authorization } });
      const getReader = vi.spyOn(req.body!, "getReader");
      const response = await send(req);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
      expect(getReader).not.toHaveBeenCalled();
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([undefined, "", "false", "TRUE", "1"])(
    "stays disabled unless the enable switch is exactly true (%s)",
    async (value) => {
      vi.stubEnv("BELUGA_WEBHOOK_ENABLED", value);
      const req = request();
      const getReader = vi.spyOn(req.body!, "getReader");
      const response = await send(req);
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: "Webhook temporarily unavailable" });
      expect(getReader).not.toHaveBeenCalled();
      expect(rpc).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, "", "prod", "TEST", "live "])(
    "fails closed for missing or invalid mode (%s)",
    async (value) => {
      vi.stubEnv("BELUGA_WEBHOOK_MODE", value);
      const req = request();
      const getReader = vi.spyOn(req.body!, "getReader");
      expect((await send(req)).status).toBe(503);
      expect(getReader).not.toHaveBeenCalled();
      expect(rpc).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, "", "short", " ".repeat(40), "x".repeat(257)])(
    "fails closed for a missing or invalid shared secret (%s)",
    async (value) => {
      vi.stubEnv("BELUGA_WEBHOOK_SECRET", value);
      expect((await send(request())).status).toBe(503);
      expect(rpc).not.toHaveBeenCalled();
    },
  );

  it("does not enable reception through the removed per-environment variables", async () => {
    vi.stubEnv("BELUGA_WEBHOOK_ENABLED", undefined);
    vi.stubEnv("BELUGA_WEBHOOK_SECRET", undefined);
    vi.stubEnv("BELUGA_WEBHOOK_MODE", undefined);
    vi.stubEnv("BELUGA_WEBHOOK_TEST_ENABLED", "true");
    vi.stubEnv("BELUGA_WEBHOOK_TEST_SECRET", SECRET);
    vi.stubEnv("BELUGA_WEBHOOK_LIVE_ENABLED", "true");
    vi.stubEnv("BELUGA_WEBHOOK_LIVE_SECRET", SECRET);
    expect((await send(request())).status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each(["GET", "HEAD", "PUT", "PATCH", "DELETE", "OPTIONS"])(
    "rejects %s with Allow: POST",
    async (method) => {
      const response = await send(request(base, { method }));
      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("POST");
      expect(rpc).not.toHaveBeenCalled();
    },
  );

  it("distinguishes content type, JSON and schema errors", async () => {
    expect((await send(request(base, { headers: { "content-type": "text/plain" } }))).status).toBe(
      415,
    );
    expect((await send(request(base, { headers: { "content-encoding": "gzip" } }))).status).toBe(
      415,
    );
    expect((await send(request(base, { raw: "{" }))).status).toBe(400);
    for (const payload of [
      null,
      [],
      {},
      { ...base, masterId: "" },
      { ...base, event: "unknown" },
      { ...base, event: "CONSULT_CONCLUDED", visitOutcome: "permanent_denial" },
      { ...rx, docName: undefined },
      { ...rx, medsPrescribed: [{ medId: "missing_fields" }] },
    ]) {
      expect((await send(request(payload))).status).toBe(422);
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it("bounds actual streamed bytes even without or with an understated Content-Length", async () => {
    const raw = " ".repeat(MAX_BELUGA_BODY_BYTES + 1);
    const variations: HeadersInit[] = [{}, { "content-length": "1" }];
    for (const headers of variations) {
      expect((await send(request(base, { raw, headers }))).status).toBe(413);
    }
    expect(
      (
        await send(
          request(base, { headers: { "content-length": String(MAX_BELUGA_BODY_BYTES + 1) } }),
        )
      ).status,
    ).toBe(413);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("strips unknown fields and gives reordered JSON the same fingerprint", async () => {
    await send(
      request({
        event: base.event,
        masterId: base.masterId,
        unknown: "do not retain",
        eventId: "unagreed",
        environment: "live",
      }),
    );
    await send(request(base));
    expect(rpc.mock.calls[0][1]).toEqual(rpc.mock.calls[1][1]);
  });

  it("rejects invalid UTF-8, empty bodies and oversized multibyte content", async () => {
    const headers = { authorization: `Bearer ${SECRET}`, "content-type": "application/json" };
    const invalid = new Request("https://example.test/api/public/webhooks/beluga", {
      method: "POST",
      headers,
      body: new Uint8Array([0xff]),
    });
    expect((await send(invalid)).status).toBe(400);
    const empty = new Request("https://example.test/api/public/webhooks/beluga", {
      method: "POST",
      headers,
    });
    expect((await send(empty)).status).toBe(400);
    expect(
      (await send(request(base, { raw: "é".repeat(MAX_BELUGA_BODY_BYTES / 2 + 1) }))).status,
    ).toBe(413);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("keeps acknowledging separately stored possible repeats without claiming deduplication", async () => {
    rpc.mockResolvedValue({ data: "possible_duplicate", error: null });
    expect(await (await send(request())).json()).toEqual({ received: true });
  });

  it("returns 200 only after the storage operation completes", async () => {
    let finish!: (value: unknown) => void;
    rpc.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    let completed = false;
    const pending = send(request()).then((r) => {
      completed = true;
      return r;
    });
    await vi.waitFor(() => expect(rpc).toHaveBeenCalled());
    expect(completed).toBe(false);
    finish({ data: "stored", error: null });
    expect((await pending).status).toBe(200);
  });

  it("handles unknown visits and storage failures without exposing or logging details", async () => {
    rpc.mockResolvedValueOnce({ data: "visit_unavailable", error: null });
    const response = await send(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Visit not available" });
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const marker = "synthetic medical and credential details";
    rpc.mockResolvedValueOnce({ data: null, error: { message: marker } });
    expect(await (await send(request())).json()).toEqual({
      error: "Webhook temporarily unavailable",
    });
    rpc.mockRejectedValueOnce(new Error(marker));
    expect((await send(request())).status).toBe(503);
    rpc.mockResolvedValueOnce({ data: "unexpected", error: null });
    expect((await send(request())).status).toBe(503);
    expect(logged).not.toHaveBeenCalled();
  });

  it("sanitizes unexpected failures", async () => {
    const req = request();
    const get = req.headers.get.bind(req.headers);
    vi.spyOn(req.headers, "get").mockImplementation((key) => {
      if (key === "authorization") throw new Error("private details");
      return get(key);
    });
    const response = await send(req);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });
});

describe("internal visit reservation", () => {
  it("generates an opaque id and stores correlation before any external API request", async () => {
    const id = await reserveBelugaVisit({ environment: "test", testReference: "synthetic_qa_1" });
    expect(id).toMatch(/^legacyrx_[a-f0-9-]{36}$/);
    expect(insert).toHaveBeenCalledWith({
      master_id: id,
      environment: "test",
      order_id: null,
      test_reference: "synthetic_qa_1",
    });
  });
  it("requires a real local order reference for live reservations and hides database errors", async () => {
    await expect(reserveBelugaVisit({ environment: "live", testReference: "qa" })).rejects.toThrow(
      "Invalid Beluga visit reservation.",
    );
    expect(insert).not.toHaveBeenCalled();
    insert.mockResolvedValueOnce({ error: { message: "private details" } });
    await expect(reserveBelugaVisit({ environment: "test", testReference: "qa" })).rejects.toThrow(
      "Beluga visit reservation unavailable.",
    );
  });
});
