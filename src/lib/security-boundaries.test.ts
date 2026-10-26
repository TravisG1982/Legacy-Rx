import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
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
