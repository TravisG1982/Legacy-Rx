import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  previous: false,
  matched: false,
  updateError: false,
  inserts: 0,
  updates: 0,
  patch: null as Record<string, unknown> | null,
}));

vi.mock("@/lib/fuse-brand.server", () => ({ verifyFuseSignature: async () => true }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === "fuse_webhook_events") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: state.previous ? { idempotency_key: "evt-1" } : null, error: null }) }),
          }),
          insert: async () => {
            state.inserts++;
            return { error: null };
          },
        };
      }
      return {
        update: (patch: Record<string, unknown>) => ({
          eq: () => ({
            select: async () => {
              state.updates++;
              state.patch = patch;
              return {
                data: state.matched ? [{ id: "order-1" }] : [],
                error: state.updateError ? { message: "database unavailable" } : null,
              };
            },
          }),
        }),
      };
    },
  },
}));

import { Route } from "./fuse-brand";

const handler = (Route.options.server!.handlers as { POST: (args: { request: Request }) => Promise<Response> }).POST;

function request() {
  return new Request("https://example.test/api/public/webhooks/fuse-brand", {
    method: "POST",
    headers: { "x-fuse-signature": "signed", "x-fuse-idempotency-key": "evt-1" },
    body: JSON.stringify({ event: "payment.succeeded", data: { sessionId: "session-1" } }),
  });
}

describe("FuseHealth webhook delivery", () => {
  beforeEach(() => {
    Object.assign(state, { previous: false, matched: false, updateError: false, inserts: 0, updates: 0, patch: null });
    process.env["FUSE_WEBHOOK_SECRET"] = "test-secret";
  });

  it("asks for a retry without consuming the event when its order is missing", async () => {
    const response = await handler({ request: request() } as never);
    expect(response.status).toBe(503);
    expect(state.inserts).toBe(0);
  });

  it("records the event only after updating the order", async () => {
    state.matched = true;
    const response = await handler({ request: request() } as never);
    expect(response.status).toBe(200);
    expect(state.updates).toBe(1);
    expect(state.inserts).toBe(1);
  });

  it("writes the event to the provider-neutral column only", async () => {
    state.matched = true;
    await handler({ request: request() } as never);
    expect(state.patch).toEqual({ provider_last_event: "FuseHealth payment.succeeded", status: "paid" });
  });

  it("does not update an order again for a recorded event", async () => {
    state.previous = true;
    const response = await handler({ request: request() } as never);
    expect(response.status).toBe(200);
    expect(state.updates).toBe(0);
    expect(state.inserts).toBe(0);
  });

  it("does not consume an event when the order update fails", async () => {
    state.updateError = true;
    const response = await handler({ request: request() } as never);
    expect(response.status).toBe(503);
    expect(state.inserts).toBe(0);
  });
});
