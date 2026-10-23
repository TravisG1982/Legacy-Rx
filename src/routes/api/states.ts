import { createFileRoute } from "@tanstack/react-router";
import { STATE_CODES, STATES } from "@/lib/legacyrx-data";

/** State choices are part of the LegacyRX catalog; no retired vendor is called. */
export const Route = createFileRoute("/api/states")({
  server: {
    handlers: {
      GET: async () => Response.json({
        states: STATES.map((name) => ({ name, code: STATE_CODES[name] ?? "" })),
      }),
    },
  },
});
