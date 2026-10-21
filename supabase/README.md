# Database schema

`migrations/` is the source of truth for the LegacyRX database schema. The first eight SQL files were applied in filename order to the empty `Legacy Rx` Supabase project on 2026-10-16. Two verified-email guest-order migrations were applied on 2026-10-21. Their filenames match the remote migration history. The first four create the original tables; the next four add the columns, tables, indexes, and function used by later checkout flows. Their SQL was moved from the former Supabase and Drizzle folders without changing its behavior.

The target project is `qczeuhomxlmrorsdceri` (Legacy Rx). This setup creates **schema only**. Do not restore `legacyrx_261016.backup` or any patient records as part of schema setup. The backup includes Lovable Cloud's managed `auth` and `storage` schemas and requires a separate, approved data migration plan.

## Future schema changes

1. Add a new timestamped SQL file under `migrations/`; do not edit a migration already applied remotely.
2. Use an authorized Supabase account to link the CLI to `qczeuhomxlmrorsdceri`: `npx supabase link --project-ref qczeuhomxlmrorsdceri`. The restricted token used for the initial setup lacked the API-key read permission required by `link`, so the eight initial migrations were applied through Supabase's Management API instead.
3. Review pending SQL with `npx supabase db push --dry-run`, then apply it with `npx supabase db push`.
4. Check migration history and verify the affected tables, RLS, indexes, policies, and functions.

Do not place database passwords or service role keys in this repository. The existing Stripe and FuzeRx columns remain because historical order code still reads or writes them. Beluga Health will require its own future migrations after its data contract is defined.
