# Database schema

`migrations/` is the source of truth for the LegacyRX database schema. Fifteen SQL migrations are recorded in the remote `Legacy Rx` migration history as of 2026-10-26: eight initial files, three verified-email/contact files, two admin access/audit files, and two additive October 26 files. The admin coupon functions are in a separate migration because the roles/audit migration had already been applied. See `DATABASE.md` for the current schema and verification details.

The target project is `qczeuhomxlmrorsdceri` (Legacy Rx). This setup creates **schema only**. Do not restore `legacyrx_261016.backup` or any patient records as part of schema setup. The backup includes Lovable Cloud's managed `auth` and `storage` schemas and requires a separate, approved data migration plan.

## Future schema changes

1. Add a new timestamped SQL file under `migrations/`; do not edit a migration already applied remotely.
2. Use an authorized Supabase account to link the CLI to `qczeuhomxlmrorsdceri`: `npx supabase link --project-ref qczeuhomxlmrorsdceri`. The current CLI identity still returned HTTP 403 when reading remote migration state on October 26; the dashboard SQL Editor was used to apply the two additive October 26 migrations and record their migration-history entries. Resolve the CLI permission before relying on `db push`.
3. Review pending SQL with `npx supabase db push --dry-run`, then apply it with `npx supabase db push`. Only migrations safe before the next deployment belong in `migrations/`; post-deployment cleanup scripts stay in `deferred/` until the new deployment is verified.
4. Check migration history and verify the affected tables, RLS, indexes, policies, and functions.

Do not place database passwords or service role keys in this repository. The existing Stripe and FuzeRx columns remain but no current code reads or writes them, pending a reviewed cleanup migration; the current FuseHealth flow writes `orders.provider_last_event`. Beluga Health will require its own future migrations after its data contract is defined.
