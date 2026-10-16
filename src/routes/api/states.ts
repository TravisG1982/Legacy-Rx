import { createFileRoute } from "@tanstack/react-router";

/**
 * States relay.
 *
 * The browser calls this LegacyRX URL; the request is forwarded server-side to
 * the WhiteLabelMD states service with our site id and normalised into a small
 * list of { name, code } entries for the checkout dropdowns.
 */

const UPSTREAM = "https://panel.whitelabelmd.com/wlmdbackend/api/get_all_states";
const SITE_ID = 533;

type StateOption = { name: string; code: string };

export const Route = createFileRoute("/api/states")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const res = await fetch(UPSTREAM, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ site_id: String(SITE_ID) }),
          });
          const json = (await res.json()) as Record<string, unknown>;
          const data = (json['data'] ?? json) as Record<string, unknown>;
          const rows = (data['states'] ?? json['states'] ?? []) as Array<Record<string, unknown>>;
          const states: StateOption[] = rows
            .map((r) => ({
              name: String(r['name'] ?? r['state_name'] ?? "").trim(),
              code: String(r['state_code'] ?? r['code'] ?? "").trim().toUpperCase(),
            }))
            .filter((s) => s.name && s.code);
          return Response.json({ states });
        } catch {
          return Response.json({ states: [] as StateOption[] });
        }
      },
    },
  },
});
