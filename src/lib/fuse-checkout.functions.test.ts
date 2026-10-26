import { beforeEach, describe, expect, it, vi } from "vitest";
import { runWithStartContext } from "@tanstack/start-storage-context";

const mocks = vi.hoisted(() => ({
  inserted: [] as Record<string, unknown>[],
  insertError: false,
  fuseFetch: vi.fn(),
  requireAssessment: vi.fn(),
}));

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table !== "orders") throw new Error(`Unexpected table ${table}`);
      return {
        insert: async (row: Record<string, unknown>) => {
          mocks.inserted.push(row);
          return { error: mocks.insertError ? { message: "database unavailable" } : null };
        },
      };
    },
  },
}));
vi.mock("./fuse-brand.server", () => ({ fuseBrandFetch: mocks.fuseFetch }));
vi.mock("./assessment.server", () => ({ requireCompletedAssessment: mocks.requireAssessment }));

// @ts-expect-error Vite virtual server-function module has no declaration.
import * as fns from "./fuse-checkout.functions.ts?tss-serverfn-split";

const input = { med: "sema", email: "Synthetic@Example.test", leadSessionId: "lead-1", utm: { utm_source: "test" } };

function call(data: unknown) {
  return runWithStartContext(
    { contextAfterGlobalMiddlewares: {}, request: new Request("http://localhost") } as never,
    () => fns.createFuseCheckout_createServerFn_handler({ data }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.inserted.length = 0;
  mocks.insertError = false;
  mocks.requireAssessment.mockResolvedValue(undefined);
  mocks.fuseFetch.mockResolvedValue({ data: { sessionId: "sess-1", embedUrl: "https://example.test/embed", expiresAt: "2026-01-01" } });
});

describe("FuseHealth checkout start (synthetic data)", () => {
  it("creates a hosted session and stores a pending order using the provider-neutral event column", async () => {
    const out = await call(input);
    expect(out.result).toEqual({ embedUrl: "https://example.test/embed", sessionId: "sess-1" });
    expect(mocks.fuseFetch).toHaveBeenCalledWith("/checkout/sessions", expect.objectContaining({ method: "POST" }));
    expect(mocks.inserted).toHaveLength(1);
    const row = mocks.inserted[0]!;
    expect(row).toMatchObject({
      email: "synthetic@example.test",
      status: "pending_payment",
      fuse_session_id: "sess-1",
      provider_last_event: "FuseHealth checkout started",
    });
    expect(Object.keys(row).filter((key) => key.startsWith("fuzerx_"))).toEqual([]);
  });

  it("requires a completed assessment before contacting the provider", async () => {
    mocks.requireAssessment.mockRejectedValue(new Error("Assessment required"));
    const out = await call(input);
    expect(out.error).toBeTruthy();
    expect(mocks.fuseFetch).not.toHaveBeenCalled();
    expect(mocks.inserted).toEqual([]);
  });

  it("does not return the session when the order cannot be saved", async () => {
    mocks.insertError = true;
    const out = await call(input);
    expect(out.error).toBeTruthy();
    expect(out.result).toBeUndefined();
  });
});
