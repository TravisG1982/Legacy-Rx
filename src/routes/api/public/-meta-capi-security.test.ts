import { afterEach, describe, expect, it, vi } from "vitest";
import { Route } from "./meta-capi";

const handlers = Route.options.server!.handlers as Record<
  string,
  (args: { request: Request }) => Promise<Response>
>;
const handler = handlers["POST"]!;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Meta CAPI route is disabled", () => {
  it("never reads the body, calls Meta or logs, even with a token and accepted cookie", async () => {
    vi.stubEnv("META_CAPI_TOKEN", "synthetic-test-token");
    vi.stubEnv("META_PIXEL_ID", "000000000000000");
    const upstream = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", upstream);
    const logged = [
      vi.spyOn(console, "error").mockImplementation(() => {}),
      vi.spyOn(console, "log").mockImplementation(() => {}),
      vi.spyOn(console, "warn").mockImplementation(() => {}),
      vi.spyOn(console, "info").mockImplementation(() => {}),
    ];
    const marker = "synthetic@example.test medical history";
    const request = new Request("https://legacyrx.test/api/public/meta-capi", {
      method: "POST",
      headers: { cookie: "lrx_analytics_consent=accepted", "content-type": "application/json" },
      body: JSON.stringify({ event_name: "PageView", test_event_code: marker }),
    });
    const readBody = vi.spyOn(request, "json");
    const readText = vi.spyOn(request, "text");

    const response = await handler({ request });

    expect(response.status).toBe(410);
    expect(await response.text()).not.toContain(marker);
    expect(request.bodyUsed).toBe(false);
    expect(readBody).not.toHaveBeenCalled();
    expect(readText).not.toHaveBeenCalled();
    expect(upstream).not.toHaveBeenCalled();
    for (const spy of logged) expect(spy).not.toHaveBeenCalled();
  });

  it("answers the same without a token, without a cookie and with malformed JSON", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    for (const init of [
      { body: "not json" },
      { body: JSON.stringify({ event_name: "Purchase" }), headers: { cookie: "x=y" } },
      {},
    ]) {
      const response = await handler({
        request: new Request("https://legacyrx.test/api/public/meta-capi", {
          method: "POST",
          ...init,
        }),
      });
      expect(response.status).toBe(410);
    }
    expect(upstream).not.toHaveBeenCalled();
  });

  it("exposes only the blocking POST handler (no CORS preflight or other method)", () => {
    expect(Object.keys(handlers)).toEqual(["POST"]);
  });
});
