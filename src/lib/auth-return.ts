const KEY = "legacyrx:auth-return";
const PENDING_KEY = "legacyrx:auth-return-pending";
const MAX_PENDING_MS = 10 * 60 * 1000;

export type AuthReturnRoute = "/admin" | "/travis" | "/account";

export function authRedirectUrl(origin: string): string {
  return `${origin}/auth`;
}

export function allowedAuthReturn(value: string | null): AuthReturnRoute {
  return value === "/admin" || value === "/travis" ? value : "/account";
}

/** A plain /auth visit discards an abandoned intent; an Auth callback keeps it. */
export function prepareAuthReturn(search: string, hash: string, storage: Storage): void {
  const params = new URLSearchParams(search);
  if (params.has("next")) {
    const route = allowedAuthReturn(params.get("next"));
    if (route === "/account") {
      storage.removeItem(KEY);
      storage.removeItem(PENDING_KEY);
    }
    else storage.setItem(KEY, route);
    return;
  }
  const callback = params.has("code") || params.has("error") || params.has("error_description") ||
    new URLSearchParams(hash.replace(/^#/, "")).has("access_token") ||
    new URLSearchParams(hash.replace(/^#/, "")).has("error_description");
  const pendingSince = Number(storage.getItem(PENDING_KEY));
  const pending = Number.isFinite(pendingSince) && pendingSince > 0 && Date.now() - pendingSince < MAX_PENDING_MS;
  if (!callback && !pending) {
    storage.removeItem(KEY);
    storage.removeItem(PENDING_KEY);
  }
}

/** Supabase may remove the OAuth code from the URL before React mounts. */
export function markAuthCallbackPending(storage: Storage): void {
  storage.setItem(PENDING_KEY, String(Date.now()));
}

export function cancelAuthCallbackPending(storage: Storage): void {
  storage.removeItem(PENDING_KEY);
}

export function consumeAuthReturn(storage: Storage): AuthReturnRoute {
  const route = allowedAuthReturn(storage.getItem(KEY));
  storage.removeItem(KEY);
  storage.removeItem(PENDING_KEY);
  return route;
}
