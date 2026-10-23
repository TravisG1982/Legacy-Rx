import { afterEach, describe, expect, it, vi } from "vitest";
import { runWithStartContext } from "@tanstack/start-storage-context";

const database = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: database }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("retired public order failure writer", () => {
  it("rejects synthetic failure submissions without touching the database", async () => {
    // @ts-expect-error Vite virtual server-function module has no declaration.
    const handlers = await import("./order-failures.functions.ts?tss-serverfn-split");
    const result = await runWithStartContext(
      { contextAfterGlobalMiddlewares: {}, request: new Request("http://localhost") } as never,
      () => handlers.logOrderFailure_createServerFn_handler({
        data: { email: "synthetic@example.test", reason: "synthetic medical details" },
      }),
    );
    expect(result.result).toEqual({ ok: false, reason: "unavailable" });
    expect(database.from).not.toHaveBeenCalled();
  });
});

describe("provider error boundaries", () => {
  it("does not expose an upstream intake response in FuseHealth errors or logs", async () => {
    vi.stubEnv("FUZERX_API_KEY", "synthetic-test-key");
    const marker = "synthetic@example.test medical history";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(marker, { status: 422 })));
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const { fuseBrandFetch } = await import("./fuse-brand.server");
    await expect(fuseBrandFetch("/checkout/sessions", { method: "POST" })).rejects.toThrow(
      "FuseHealth request failed [422].",
    );
    expect(JSON.stringify(logged.mock.calls)).not.toContain(marker);
  });
});
