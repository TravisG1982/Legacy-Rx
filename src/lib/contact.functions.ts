import { createServerFn } from "@tanstack/react-start";

/** Retired contact delivery must remain unavailable even to direct server-function callers. */
export const submitContactMessage = createServerFn({ method: "POST" }).handler(
  async () => ({ ok: false as const, reason: "unavailable" as const }),
);
