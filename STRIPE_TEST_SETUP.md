# LegacyRX Stripe test payments: setup

Test-mode only. This path is separate from FuseHealth (`/start/$med`, `/api/public/webhooks/fuse-brand`) and from Beluga. It never reads or writes `orders`. The moment of authorization and capture is **not decided**: confirm it with Beluga before production (see "Provisional choices").

## What exists

| Piece | Location |
| --- | --- |
| Start page (button only; the server fixes the amount) | `/pay-test/<med>` (e.g. `/pay-test/sema`) after finishing `/qualify` |
| Result page (needs the private link Stripe redirects to) | `/pay-test/result` |
| Webhook endpoint | `POST /api/public/webhooks/stripe-test` |
| Tables / function | `payment_test_orders`, `payment_test_webhook_events`, `apply_payment_test_event()` in `20261026130000_create_stripe_test_payments.sql` |

Guards: it works only when `STRIPE_TEST_PAYMENTS_ENABLED=true` **and** the key starts with `sk_test_`; creating a payment also requires a signed-in, verified account whose email equals `STRIPE_TEST_ALLOWED_EMAIL`. Live-mode events and sessions are rejected. Prices come from `legacyrx-data.ts` on the server; Stripe receives only an opaque order id and the label `LegacyRX order <number>` (no email, product, plan or health data in our Stripe request). Stripe's hosted form may collect the payer's own email.

## Steps

### 1. Database
Both required migrations were applied to the Legacy Rx Supabase project on October 26, in order: `20261026120000_add_orders_provider_last_event.sql` and `20261026130000_create_stripe_test_payments.sql`. The coupon-function cleanup stays in `supabase/deferred/` and must not be applied yet. The Stripe migration adds only test tables and one function.

### 2. Stripe Dashboard (LegacyRX account, **Test mode**)
1. Switch the top-right toggle to **Test mode** (orange "Test mode" banner must be visible).
2. **Developers > API keys**: copy the **Secret key** (`sk_test_...`). Do not use the publishable key; none is needed (hosted Checkout).
3. **Developers > Webhooks > Add endpoint** (in some UIs: *Add destination > Webhook endpoint*):
   - Endpoint URL: `https://<your-preview-host>/api/public/webhooks/stripe-test`
   - Events: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.amount_capturable_updated`
   - Save, then open the endpoint and click **Reveal** under **Signing secret** (`whsec_...`).
4. Use the **Preview** deployment URL only. Do not register the production domain until the flow is approved.

### 3. Vercel (Project > Settings > Environment Variables)
Add to the **Preview** environment only (not Production), Sensitive = on:

| Variable | Value |
| --- | --- |
| `STRIPE_TEST_PAYMENTS_ENABLED` | `true` |
| `STRIPE_TEST_SECRET_KEY` | `sk_test_...` from step 2.2 |
| `STRIPE_TEST_WEBHOOK_SECRET` | `whsec_...` from step 2.3 |
| `STRIPE_TEST_ALLOWED_EMAIL` | Exact email of the verified QA account, e.g. `thisissoftwaredevv@gmail.com` |
| `STRIPE_TEST_RETURN_ORIGIN` | Exact preview origin, e.g. `https://your-preview.vercel.app`; use `http://localhost:3000` only for local QA |
| `STRIPE_TEST_CAPTURE_METHOD` | optional: `manual` to test authorize-only; omit for immediate capture |

Existing variables used: `SESSION_SECRET` and Supabase keys. `STRIPE_TEST_RETURN_ORIGIN` is required so the private result link cannot accidentally be sent to the production origin or to a request-supplied host. Redeploy the Preview after changing variables.

### 4. Try it
1. Sign in with the verified QA account matching `STRIPE_TEST_ALLOWED_EMAIL`. Complete `/qualify` for a product using that same email and synthetic answers, then open `/pay-test/<med>` and press **Continue to test payment**. A different or signed-out account is rejected by the server.
2. Success: card `4242 4242 4242 4242`, any future expiry, any CVC. The result page shows "Payment received (test mode)" once the webhook arrives.
3. Failure: card `4000 0000 0000 0002` (declined). The status becomes "payment failed"; paying again with 4242 in the same session ends as paid.
4. Check **Stripe > Developers > Webhooks > your endpoint > Event deliveries** for `200` responses. A `400` means a wrong signing secret; `404` means the flag or a `sk_test_` key is missing.
5. Local development: `stripe listen --forward-to localhost:3000/api/public/webhooks/stripe-test` prints a temporary `whsec_...`; put it in `.env.local` as `STRIPE_TEST_WEBHOOK_SECRET`.

## Behavior to know
- A second click while a payment is open returns to the same Stripe session (one open order per email + product + plan).
- Webhooks are verified on the raw body (5-minute tolerance) and each event id is stored once; replays are acknowledged and ignored. An event for an unknown order, or a PaymentIntent event that arrives before its Checkout session binds the PaymentIntent ID, returns `503` so Stripe retries. A different session or PaymentIntent ID is ignored.
- Statuses only move forward: `pending_payment` < `abandoned`/`payment_failed` < `authorized` < `paid`. A late failure or expiry cannot undo a payment. A paid event whose amount or currency differs from the order marks it `order_error` and is never treated as paid.
- The order's private link (token in the redirect URL) is the only way to read a test order; the database stores only its hash.

## Provisional choices (revisit with Beluga)
- Capture timing: default is immediate capture; `manual` is available for authorize-only testing. Nothing captures funds later or voids/refunds yet.
- Not included: refunds, cancellations, disputes, subscriptions and renewals, receipts, account/dashboard display, linking to a Beluga intake, tax, shipping.
- Replace `/pay-test/...` routes with the real checkout UI once the sequence is agreed; keep the webhook/state logic if it still fits.

## Cleanup / go-live notes
- Remove the `STRIPE_TEST_*` variables from Vercel to switch the path off completely (the routes then answer "not available" / 404).
- A live path needs separate live keys, a separate webhook endpoint and secret, a review of the reuse of `payment_test_orders` or a new table, and an agreement covering patient data handling.
