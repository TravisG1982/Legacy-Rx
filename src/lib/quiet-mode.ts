/**
 * "Quiet mode" is switched on while a visitor is on the payment screen, so
 * attention-grabbing overlays (purchase notifications, idle offer reminder)
 * stay out of the way while a card is being entered.
 */
let quiet = false;
const listeners = new Set<(v: boolean) => void>();

export function setQuietMode(next: boolean) {
  if (quiet === next) return;
  quiet = next;
  listeners.forEach((fn) => fn(quiet));
}

export function isQuietMode() {
  return quiet;
}

export function subscribeQuietMode(fn: (v: boolean) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
