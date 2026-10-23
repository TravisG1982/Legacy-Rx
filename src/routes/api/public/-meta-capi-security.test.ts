import { afterEach, describe, expect, it, vi } from "vitest";
import { Route } from "./meta-capi";

const handler = (Route.options.server!.handlers as { POST: (args: { request: Request }) => Promise<Response> }).POST;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Meta CAPI response boundary", () => {
  it("does not echo a provider error containing synthetic sensitive data", async () => {
    vi.stubEnv("META_CAPI_TOKEN", "synthetic-test-token");
    const marker = "synthetic@example.test medical history";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(marker, { status: 400 })));
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const request = new Request("https://legacyrx.test/api/public/meta-capi", {
      method: "POST",
      headers: { cookie: "lrx_analytics_consent=accepted", "content-type": "application/json" },
      body: JSON.stringify({ event_name: "PageView", test_event_code: marker }),
    });
    const response = await handler({ request });
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain(marker);
    expect(JSON.stringify(logged.mock.calls)).not.toContain(marker);
    expect(JSON.stringify(vi.mocked(fetch).mock.calls)).not.toContain(marker);
  });
});
