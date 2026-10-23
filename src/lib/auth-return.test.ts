import { describe, expect, it } from "vitest";
import { authRedirectUrl, consumeAuthReturn, markAuthCallbackPending, prepareAuthReturn } from "./auth-return";

function storage(): Storage {
  const entries = new Map<string, string>();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => { entries.set(key, value); },
    removeItem: (key) => { entries.delete(key); },
    clear: () => entries.clear(),
    key: (index) => [...entries.keys()][index] ?? null,
    get length() { return entries.size; },
  };
}

describe("Supabase Auth return route", () => {
  it.each(["/admin", "/travis"])("returns to %s after a Google OAuth callback and consumes the intent", (route) => {
    const tab = storage();
    prepareAuthReturn(`?next=${encodeURIComponent(route)}`, "", tab);
    markAuthCallbackPending(tab);
    expect(authRedirectUrl("https://legacyrx.net")).toBe("https://legacyrx.net/auth");
    prepareAuthReturn("?code=synthetic-oauth-code", "", tab);
    expect(consumeAuthReturn(tab)).toBe(route);
    expect(consumeAuthReturn(tab)).toBe("/account");
  });
  it("returns to account for an invalid route or a callback on another device", () => {
    const tab = storage();
    prepareAuthReturn("?next=https://attacker.example", "", tab);
    expect(consumeAuthReturn(tab)).toBe("/account");
    const otherDevice = storage();
    prepareAuthReturn("?code=synthetic-email-code", "", otherDevice);
    expect(consumeAuthReturn(otherDevice)).toBe("/account");
  });
  it("drops an abandoned intent on an ordinary repeat visit to /auth", () => {
    const tab = storage();
    prepareAuthReturn("?next=%2Fadmin", "", tab);
    prepareAuthReturn("", "", tab);
    expect(consumeAuthReturn(tab)).toBe("/account");
  });
  it("keeps a recent OAuth intent when Supabase has already removed the code from the URL", () => {
    const tab = storage();
    prepareAuthReturn("?next=%2Fadmin", "", tab);
    markAuthCallbackPending(tab);
    prepareAuthReturn("", "", tab);
    expect(consumeAuthReturn(tab)).toBe("/admin");
  });
  it("keeps the intent after an OAuth error so the same tab can retry", () => {
    const tab = storage();
    prepareAuthReturn("?next=%2Ftravis", "", tab);
    prepareAuthReturn("?error=access_denied", "", tab);
    expect(consumeAuthReturn(tab)).toBe("/travis");
  });
});
