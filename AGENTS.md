# Agent rules

- New orders go through FuseHealth's Brand API hosted intake + payment (`POST /checkout/sessions`, iframe on `/start/$med`); program IDs live in `FUSE_PROGRAM_IDS` and products without one are hidden. Why: FuseHealth is merchant of record and handles payment, provider review, fulfillment and refunds.
- Order status updates arrive on `/api/public/webhooks/fuse-brand`, verified with `X-Fuse-Signature` and deduped by `X-Fuse-Idempotency-Key`; rows match by `fuse_order_id` or `fuse_session_id`. Why: Fuse webhooks carry only opaque ids, so the row is created when the session starts.
- Customer accounts match orders and subscriptions by verified email (as well as `user_id`). Why: checkout doesn't require sign-in, so guest orders still appear after sign-up.
- Legacy Stripe checkout, coupons and renewal code stay in place but unlinked, for historic orders only. Why: older orders remain visible in /travis.
- Unpaid orders older than 24h are swept to `abandoned` lazily (on checkout creation and /travis load). Why: no cron needed.
- Products are defined in `legacyrx-data.ts` (`MEDS`, `MED_INFO` with a `track`), and each product's monthly renewal Stripe price uses lookup key `${medKey}_monthly`. Why: new FuzeRx catalog products are added by data only; checkout, coupons, qualify and pages read from it.
- Non-GLP-1 programs reuse `/qualify?track=<trt|hrt|aa|sh>` with per-track screening; intake summary text goes to FuzeRx as the consult conditions. Why: one funnel, one checkout.

- Use semantic medical-red and ivory brand tokens as the visual source of truth across shared pages and scoped campaign palettes. Why: the customer experience must maintain one consistent LegacyRx identity.
- Blog articles live in the typed `blog-data.ts` catalog and render through one dynamic route. Why: listing cards, metadata, and article pages stay synchronized as content grows.
- The order helper (`OrderHelp` in FunnelShell) calls the OpenAI API server-side via `askOrderHelp` with a fixed non-medical system prompt. Why: customers get stuck-point guidance without the app ever giving medical advice or exposing the AI key.
