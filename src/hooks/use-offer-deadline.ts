import { useEffect, useState } from "react";

const KEY = "lrx_offer_deadline";
const WINDOW_MS = 15 * 60 * 1000;

function writeDeadline(value: number) {
  try {
    window.localStorage.setItem(KEY, String(value));
  } catch {
    /* ignore */
  }
  return value;
}

function readDeadline(renewMs?: number): number {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed)) {
      // An already-expired window is refreshed when the caller asks for a
      // renewal (checkout keeps a live reservation timer instead of dead text).
      if (parsed <= Date.now() && renewMs) return writeDeadline(Date.now() + renewMs);
      if (parsed > Date.now() - 24 * 60 * 60 * 1000) return parsed;
    }
  } catch {
    /* storage unavailable */
  }
  return writeDeadline(Date.now() + (renewMs ?? WINDOW_MS));
}

/**
 * Shared 15-minute offer countdown that persists across funnel steps and reloads.
 * Returns `ready: false` until hydrated so SSR and client markup match.
 * Pass `renewMs` to restart the window when it has already expired.
 */
export function useOfferDeadline(renewMs?: number) {
  const [remaining, setRemaining] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const deadline = readDeadline(renewMs);
    const tick = () => setRemaining(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    setReady(true);
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [renewMs]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return { ready, remaining, expired: ready && remaining <= 0, label: `${mm}:${ss}` };
}
