# Legacy Rx Database

Status as of October 26, 2026. Target Supabase project: **Legacy Rx**, project ID `qczeuhomxlmrorsdceri`. The application schema is `public`; authentication is managed by Supabase Auth. All four October 26 migrations are applied in the hosted project. The coupon cleanup script remains deferred.

## Current state

- Seventeen SQL migrations from [`migrations/`](./migrations/) have been applied. The October 26 versions were verified in the hosted migration history; their column, tables, function, RLS, and grants exist. The coupon functions are executable by `service_role`, not `anon` or `authenticated`.
- The `public` schema contains twelve tables: the prior ten plus `payment_test_orders` and `payment_test_webhook_events`. Auth users, orders, and subscriptions were empty before the two October 21 migrations; no records were imported.
- Row Level Security (RLS) is enabled on all twelve tables. The verified-email claim function is executable only by `service_role`, and client roles have no table privileges on `account_email_claims` or the two test-payment tables.
- There are no foreign keys between these tables. The `user_id` columns in `orders` and `subscriptions` have no foreign key to `auth.users`. The application also associates orders and subscriptions with accounts by verified email.
- The admin application connected to this project on October 23 using synthetic/test data. Role assignment, TOTP gating, permission changes, access revocation, and read/export audit records were verified. Auth configuration, secrets, backups, broader security controls, and vendor agreements still need production review. This document does not establish readiness to store real patient data.

## Tables

| Table | Purpose | Key fields and constraints |
| --- | --- | --- |
| `funnel_leads` | Early intake data and contact consent. | `id` is a UUID primary key; `session_id` is required and unique. Includes name, email, phone, state, `age_18` and `on_glp1` answers, separate operational and marketing email consent flags, SMS consent flags, `stage`, `created_at`, and `updated_at`. |
| `orders` | Orders and their payment, consultation, and fulfillment state. | `id` is a UUID primary key; `order_number` is unique. Includes customer details, medication, plan, product, amounts, `status`, `payment_mode`, `environment`, `user_id`, and Stripe, FuzeRx, and FuseHealth fields (`fuse_order_id`, `fuse_session_id`). Non-null `fuse_order_id` values are unique. |
| `contact_messages` | Historical contact form submissions; new submissions are paused. | `id` is a UUID primary key and doubles as the submission ID. `name`, `email`, `phone`, and `message` are required. Includes consent flags, delivery status and timestamps, and `created_at`. |
| `order_failures` | Diagnostic records for failed order creation or processing. | `id` is a UUID primary key. Optional session and contact details, product, amount, `reason`, and `created_at`. |
| `subscriptions` | Subscription and billing-period records. | `id` is a UUID primary key; `stripe_subscription_id` is required and unique. Includes `stripe_customer_id`, `email`, `price_id`, status, billing periods, cancellation flag, `environment`, `user_id`, and timestamps. |
| `account_email_claims` | Reserves a normalized verified email for one account while guest records are claimed. | `email` is the primary key; `user_id` identifies the account. RLS is enabled, and `anon` and `authenticated` have no table privileges. |
| `coupons` | Discount codes and redemption counts. | `id` is a UUID primary key. `code` is unique case-insensitively; `type` must be `percent`, `fixed`, or `fixed_total`; `amount` must be non-negative. Includes active flag, expiry, limits, and medication list. |
| `fuse_webhook_events` | Idempotency keys for processed FuseHealth webhook events. | `idempotency_key` is the text primary key. Also stores `event` and `received_at`. |
| `admin_roles` | Exact Supabase Auth user ID to `owner` or `staff` assignment. | Staff permissions `view_leads`, `delete_leads`, `view_pricing`, `manage_coupons` default to false. Owner has all four permissions in application policy. |
| `admin_audit_log` | Minimal record of authenticated admin reads, denied requests, validation errors, and mutations. | Actor ID, action, object type/identifier, timestamp, outcome (`success`, `denied`, `failure`, `validation_error`). No request body or patient details. Successful bulk deletion records one row per deleted lead UUID. Anonymous requests do not write audit rows. |

The `orders` table contains the current FuseHealth identifiers (`fuse_order_id`, `fuse_session_id`) and legacy Stripe/FuzeRx columns. `provider_last_event` is in place for the new application code. As of October 26 the new application code no longer reads or writes the legacy `fuzerx_*`, `stripe_*`, `coupon_code`, `discount`, `card_last4` or `payment_mode` columns; they are retained for historical rows only. `stripe_invoice_id` and `fuse_order_id` have partial unique indexes, so uniqueness is enforced only for non-null values.

## Access and RLS

| Tables | Policies defined in SQL | Access through the Data API |
| --- | --- | --- |
| `orders`, `order_failures`, `subscriptions`, `coupons` | One `FOR ALL TO service_role` policy per table, with `USING (true)` and `WITH CHECK (true)`. | There are no policies for `anon` or `authenticated`, so RLS denies their row access. Server-side `service_role` has access. |
| `funnel_leads`, `contact_messages`, `fuse_webhook_events` | No policies. | RLS also denies row access to `anon` and `authenticated`. Server-side `service_role` has an explicit `GRANT ALL` and bypasses RLS. |
| `account_email_claims` | No client policies. | Client-role table privileges are explicitly revoked; `service_role` has `SELECT` and `INSERT` and bypasses RLS. |
| `admin_roles`, `admin_audit_log` | RLS enabled, no client policies, client table and audit sequence privileges revoked. | Only server-side `service_role` has the minimal required privileges. No public role-assignment endpoint. |

The original seven tables have `GRANT ALL TO service_role`; `account_email_claims` grants only `SELECT` and `INSERT`. The `service_role` key belongs only in server-side code and must not be exposed in the React client. RLS does not replace reviews of server endpoints, secret handling, or audit logging.

### Access review, October 23

The hosted project's ten public tables all had RLS enabled. An anonymous Data API read of each table returned no rows (or a permissions error for the restricted tables), and an anonymous call to the verified-email claim function was denied. The older tables retain client-role table grants, but have no `anon` or `authenticated` row policies; RLS blocks their rows. No grant-changing migration was applied for this review.

Automated server-function tests cover anonymous and patient denial for admin actions, staff permissions, owner access, MFA enforcement, and immediate denial after role revocation. Account-order tests cover verified email, ownership, and foreign order numbers. The public legacy order-failure writer was disabled because it allowed arbitrary details to be inserted with the service key. Provider responses and raw exceptions were removed from affected public responses and logs. Local production-build static files did not contain the nonempty local service key or session secret. These checks use synthetic data and do not replace a production deployment review or a full HIPAA assessment.

## Indexes and other schema objects

- `funnel_leads`: primary key on `id`, unique `session_id`, and an index on `created_at DESC`.
- `orders`: primary key on `id`, unique `order_number`, indexes on `stripe_session_id`, `fuzerx_consult_id`, and `lower(email)`, plus partial unique indexes on `stripe_invoice_id`, `fuse_order_id`, `fuse_session_id`, and `stripe_session_id`.
- `contact_messages`: primary key on `id`.
- `order_failures`: primary key on `id` and an index on `created_at DESC`.
- `subscriptions`: primary key on `id`, unique `stripe_subscription_id`, and an index on `lower(email)`.
- `coupons`: primary key on `id` and a unique index on `lower(code)`.
- `fuse_webhook_events`: primary key on `idempotency_key`.
- `account_email_claims`: primary key on normalized `email`.

The `set_updated_at()` function updates `updated_at` through triggers on `funnel_leads`, `subscriptions`, and `coupons`. The `redeem_coupon(code)` function increments a coupon's usage count. `claim_verified_guest_records(uuid)` checks the current Auth record and claims matching guest records atomically. Execution of both callable functions is revoked from `public`, `anon`, and `authenticated` and granted to `service_role`.

## Migrations

Schema migrations live in [`supabase/migrations/`](./migrations/) and run in timestamp order. Do not edit migrations that have already been applied remotely; add a new migration for each subsequent schema change.

| File | Change |
| --- | --- |
| `20261016091731_create_funnel_leads.sql` | Creates `funnel_leads`, its index, and the `set_updated_at` function and trigger. |
| `20261016091748_create_orders.sql` | Creates the base `orders` table and its RLS policy. |
| `20261016091753_create_contact_messages.sql` | Creates `contact_messages`. |
| `20261016091757_create_order_failures.sql` | Creates `order_failures`, its RLS policy, and an index. |
| `20261016091800_add_order_fulfillment_fields.sql` | Adds order fields for payment, consultations, and fulfillment, plus indexes. |
| `20261016091805_add_order_prescription_token.sql` | Adds `fuzerx_prescription_token` to `orders`. |
| `20261016091809_add_subscriptions_coupons_accounts.sql` | Adds account and subscription fields to `orders`; creates `subscriptions`, `coupons`, their policies, indexes, and triggers, and `redeem_coupon`. |
| `20261016091814_add_fuse_brand_order_fields.sql` | Adds FuseHealth IDs to `orders` and creates `fuse_webhook_events` for webhook deduplication. |
| `20261021120000_claim_verified_guest_records.sql` | Claims guest orders and subscriptions only for a verified account email. |
| `20261021120100_revoke_account_email_claims_client_grants.sql` | Restricts the account-email reservation table to the server role. |
| `20261021120200_contact_delivery_and_email_marketing.sql` | Separates email marketing consent and records contact-form delivery attempts. |
| `20261023120000_admin_roles_and_audit.sql` | Adds per-user roles, staff permissions, protected admin audit log, and service-only transactional lead deletion. Applied. |
| `20261023130000_admin_coupon_audit_transactions.sql` | Adds transactional service-only coupon create/update/delete functions with audit entries. Applied. The functions are dropped by `20261026120100`. |
| `20261026120000_add_orders_provider_last_event.sql` | **Applied October 26.** Adds `orders.provider_last_event` and copies `fuzerx_last_event` into it. |
| `20261026130000_create_stripe_test_payments.sql` | **Applied October 26.** Adds `payment_test_orders`, `payment_test_webhook_events` and the service-only `apply_payment_test_event()` for the test-mode Stripe path. |
| `20261026140000_fix_stripe_test_failed_intent.sql` | **Applied October 26.** Lets a signed failed-payment event update an open test Checkout before a completed-session event exists, while retaining amount/currency and session checks. |
| `20261026150000_harden_stripe_test_failed_amount.sql` | **Applied October 26.** Rejects a failed-payment event that lacks an amount when binding its first PaymentIntent. |
| `../deferred/20261026120100_drop_coupon_functions.sql` | **Deferred, not applied.** Drops `save_admin_coupon`, `delete_admin_coupon` and `redeem_coupon` only after the new deployment is verified. It is outside `migrations/` so `db push` cannot apply it early. |

The application calls `delete_admin_funnel_leads` with the actor ID from its verified server-side Supabase Auth check. The function checks the current database role again, deletes the requested leads, and inserts one audit row per deleted UUID in the **same transaction**. A failed audit insert rolls back the deletion. `anon` and `authenticated` cannot execute the function. A zero-row deletion records the attempted action without a patient identifier.

Exporting lead CSV calls a separate server function that rechecks current access and records `export_leads` before offering the downloaded data. On October 23, an export of an empty test dashboard produced one successful audit row.

Until `20261026120100` is applied, the service-only `save_admin_coupon` and `delete_admin_coupon` functions still exist, but the application no longer calls them (the coupon admin screen was removed on October 26). Historically they rechecked the actor's current role and committed the coupon change with its audit row in one transaction. A failed audit insert rolled back the coupon change.

On October 23, both admin migrations, both coupon functions, and their SQL grants were verified in the hosted project. A coupon create/delete was exercised inside a transaction and rolled back; the test coupon and its audit rows were absent afterward. No client-facing coupon write was performed against the hosted project.

Admin OAuth and email-confirmation callbacks use the exact `/auth` URL. The browser temporarily stores an allowlisted `/admin` or `/travis` destination in that tab's `sessionStorage` and removes it after a successful sign-in. A callback opened on another device, an invalid destination, or an ordinary new `/auth` visit goes to `/account`.

## First owner assignment and staff access

1. Both admin migrations are applied. Verify TOTP MFA is enabled in Supabase Auth settings and email confirmation is required. Remove `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `TRAVIS_PASSWORD` from deployment settings after verifying the new path.
2. The customer creates or signs into a personal Supabase Auth account and confirms its email. Out of band, verify the customer's identity and obtain their **exact Auth user ID** from the Supabase Auth dashboard. Do not select the account by email alone or grant a role during ordinary sign-up.
3. A trusted operator executes a reviewed SQL statement in the Supabase SQL editor, replacing the placeholder with that verified user ID: `insert into public.admin_roles (user_id, role) select id, 'owner' from auth.users where id = '<verified-auth-user-uuid>'::uuid and email_confirmed_at is not null;`. Check that exactly one row was inserted and that the resulting user ID matches the intended account. Do not place this statement in a migration or automate the first owner grant.
4. The owner signs in at `/admin` or `/travis`, enrolls an authenticator, and verifies a TOTP code. Test access with a fresh session. Revoke access by deleting the `admin_roles` row; the next server request checks the table and is denied even if the browser session remains active.

For later staff accounts, use the same identity verification and exact-ID procedure. Insert `role = 'staff'` with only the approved permission flags set to true; all omitted flags remain false. There is no staff-management UI. The application never exposes the service key to the browser.

On October 23, `thisissoftwaredevv@gmail.com` was temporarily assigned `owner` for live testing. TOTP enrollment and verification opened `/travis` and `/admin`; changing that same account to restricted `staff` immediately changed the pages it could view; deleting its role immediately returned `/admin` to “Access unavailable.” The temporary role was removed and the local session signed out. The verified TOTP factor remains on that Auth account. No customer owner/staff role has been provisioned by this test.

## Deployment sequence and deferred cleanup (October 26)

The FuseHealth webhook and checkout used to record events in `orders.fuzerx_last_event`. They now write `orders.provider_last_event`. Safe order:

1. `20261026120000_add_orders_provider_last_event.sql` is applied (additive; the old deployment keeps working).
2. Deploy the new code.
3. Re-run the `UPDATE` in that file once to copy any events the old deployment wrote to `fuzerx_last_event` during the rollout (it is idempotent).
4. After smoke testing and the rollback window, move `supabase/deferred/20261026120100_drop_coupon_functions.sql` into `supabase/migrations/`, review `db push --dry-run`, then apply it.
5. Optionally regenerate `src/integrations/supabase/types.ts`; it currently includes `provider_last_event` by hand and still lists the coupon functions until step 4.

Rollback: the old code works against both additive migrations; do not apply step 4 before the old deployment is gone. Both additive versions are already recorded in the hosted migration history.

## Test-mode Stripe tables (applied October 26)

`payment_test_orders` holds test orders only (email, medication, plan, server-fixed `amount_cents`, status, Stripe session/intent ids, hash of the buyer's access token); it holds no intake answers and is separate from `orders`. A partial unique index allows one open attempt (`pending_payment` or `payment_failed`) per email, product and plan. `payment_test_webhook_events` stores processed Stripe event ids. Both tables have RLS enabled with no client policies and no `anon`/`authenticated` privileges; `service_role` has `SELECT/INSERT/UPDATE` (events: `SELECT/INSERT`). `apply_payment_test_event(...)` is `SECURITY DEFINER`, executable only by `service_role`: it records the event id and advances the order in one transaction (status rank `pending_payment` < `abandoned`/`payment_failed` < `authorized` < `paid` < `order_error`), marks an amount or currency mismatch as `order_error`, and rolls back (not consuming the event id) when the order is unknown. A signed declined-card event can update an open Checkout before completion only if a server-stored session exists and its amount/currency match. The migration SQL is exercised by `src/lib/stripe-test-sql.test.ts` on PGlite with synthetic rows.

## Deferred cleanup (not done)

Nothing below is dropped, because historical-data needs and backups have not been confirmed: `orders.fuzerx_*`, `orders.stripe_*`, `orders.coupon_code`, `orders.discount`, `orders.card_last4`, `orders.payment_mode`, `orders.is_renewal`, `orders.environment`, `order_failures`, `subscriptions`, `coupons`, `admin_roles.manage_coupons` (the application ignores it; owner policy no longer grants it). Drop them in a later migration once the Lovable backup is verified and the new Stripe/Beluga schema is designed.

The workflow for future migrations is described in [`supabase/README.md`](./README.md).

On October 21, 2026, `20261021120000_claim_verified_guest_records.sql` and `20261021120100_revoke_account_email_claims_client_grants.sql` were applied to the hosted Legacy Rx project. The first adds an atomic, verified-email claim for guest orders and subscriptions, reserves each normalized email for one account, and makes FuseHealth and Stripe session identifiers unique. The second explicitly revokes Supabase's default client-role table grants. Their migration-history entries, schema objects, RLS, and grants were checked in the hosted project.

On October 21, 2026, `20261021120200_contact_delivery_and_email_marketing.sql` was applied to the same project. The migration history contains one entry for version `20261021120200`; `email_marketing_consent` and all three contact delivery columns were verified in `information_schema`. Existing contact rows default to `unconfirmed` because their delivery outcomes cannot be inferred. New rows explicitly start as `pending`.

On October 23, 2026, the client confirmed that WhiteLabelMD is retired. The contact page still shows disabled fields, and the server function returns `unavailable` without writing to `contact_messages` or forwarding a request. On October 26, the client requested restoring the form for general order, account, shipping and website support. Existing rows and applied migrations remain for history. Before reopening submissions, choose and verify a client-controlled support delivery route, restricted access and handling of accidentally submitted medical information. Medical questions must use Beluga's approved secure patient channel once confirmed, not this general form or ordinary email.
