# Legacy Rx Database

Status as of October 21, 2026. Target Supabase project: **Legacy Rx**, project ID `qczeuhomxlmrorsdceri`. The application schema is `public`; authentication is managed by Supabase Auth.

## Current state

- Ten SQL migrations from [`migrations/`](./migrations/) have been applied. Local filenames match the migration history in Supabase.
- The `public` schema contains eight tables. Auth users, orders, and subscriptions were empty before the two October 21 migrations; no records were imported.
- Row Level Security (RLS) is enabled on all eight tables. The verified-email claim function is executable only by `service_role`, and client roles have no table privileges on `account_email_claims`.
- There are no foreign keys between these tables. The `user_id` columns in `orders` and `subscriptions` have no foreign key to `auth.users`. The application also associates orders and subscriptions with accounts by verified email.
- The schema is installed, but application connectivity, Auth settings, secrets, backups, and audit logging still need separate verification. This document does not establish readiness to store real patient data.

## Tables

| Table | Purpose | Key fields and constraints |
| --- | --- | --- |
| `funnel_leads` | Early intake data and contact consent. | `id` is a UUID primary key; `session_id` is required and unique. Includes name, email, phone, state, `age_18` and `on_glp1` answers, separate email/SMS consent flags, `stage`, `created_at`, and `updated_at`. |
| `orders` | Orders and their payment, consultation, and fulfillment state. | `id` is a UUID primary key; `order_number` is unique. Includes customer details, medication, plan, product, amounts, `status`, `payment_mode`, `environment`, `user_id`, and Stripe, FuzeRx, and FuseHealth fields (`fuse_order_id`, `fuse_session_id`). Non-null `fuse_order_id` values are unique. |
| `contact_messages` | Contact form submissions. | `id` is a UUID primary key. `name`, `email`, `phone`, and `message` are required. Includes consent flags and `created_at`. |
| `order_failures` | Diagnostic records for failed order creation or processing. | `id` is a UUID primary key. Optional session and contact details, product, amount, `reason`, and `created_at`. |
| `subscriptions` | Subscription and billing-period records. | `id` is a UUID primary key; `stripe_subscription_id` is required and unique. Includes `stripe_customer_id`, `email`, `price_id`, status, billing periods, cancellation flag, `environment`, `user_id`, and timestamps. |
| `account_email_claims` | Reserves a normalized verified email for one account while guest records are claimed. | `email` is the primary key; `user_id` identifies the account. RLS is enabled, and `anon` and `authenticated` have no table privileges. |
| `coupons` | Discount codes and redemption counts. | `id` is a UUID primary key. `code` is unique case-insensitively; `type` must be `percent`, `fixed`, or `fixed_total`; `amount` must be non-negative. Includes active flag, expiry, limits, and medication list. |
| `fuse_webhook_events` | Idempotency keys for processed FuseHealth webhook events. | `idempotency_key` is the text primary key. Also stores `event` and `received_at`. |

The `orders` table contains both current FuseHealth fields and Stripe/FuzeRx fields used by code paths in the repository. `stripe_invoice_id` and `fuse_order_id` have partial unique indexes, so uniqueness is enforced only for non-null values.

## Access and RLS

| Tables | Policies defined in SQL | Access through the Data API |
| --- | --- | --- |
| `orders`, `order_failures`, `subscriptions`, `coupons` | One `FOR ALL TO service_role` policy per table, with `USING (true)` and `WITH CHECK (true)`. | There are no policies for `anon` or `authenticated`, so RLS denies their row access. Server-side `service_role` has access. |
| `funnel_leads`, `contact_messages`, `fuse_webhook_events` | No policies. | RLS also denies row access to `anon` and `authenticated`. Server-side `service_role` has an explicit `GRANT ALL` and bypasses RLS. |
| `account_email_claims` | No client policies. | Client-role table privileges are explicitly revoked; `service_role` has `SELECT` and `INSERT` and bypasses RLS. |

The original seven tables have `GRANT ALL TO service_role`; `account_email_claims` grants only `SELECT` and `INSERT`. The `service_role` key belongs only in server-side code and must not be exposed in the React client. RLS does not replace reviews of server endpoints, secret handling, or audit logging.

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

The workflow for future migrations is described in [`supabase/README.md`](./README.md).

On October 21, 2026, `20261021120000_claim_verified_guest_records.sql` and `20261021120100_revoke_account_email_claims_client_grants.sql` were applied to the hosted Legacy Rx project. The first adds an atomic, verified-email claim for guest orders and subscriptions, reserves each normalized email for one account, and makes FuseHealth and Stripe session identifiers unique. The second explicitly revokes Supabase's default client-role table grants. Their migration-history entries, schema objects, RLS, and grants were checked in the hosted project.
