> Historical development checklist. Its checked items describe earlier implementations, not current launch readiness. For current decisions, verification status, and open work, use `agents/PROJECT_CONTEXT.md`, `agents/QA_TODO.md`, and `supabase/DATABASE.md`.

> October 23 client direction: launch LegacyRX using Beluga Health's branded hosted medical intake forms via API/webhooks and a new LegacyRX-controlled Stripe checkout. Keep FuseHealth for the existing flow until the replacement is verified. A fully direct Beluga API intake is a later option. Beluga's approximate 30-day hosted-forms estimate is not an approved launch date for the whole application.

## New
- [x] FuzeRx integration (sandbox key) — checkout now creates server-side orders; FuzeRx patient + consult submitted after payment; fill request dispatched on NOTIFY_RX webhook
- [x] FuzeRx webhook route /api/public/webhooks/fuzehealth (key-gated) handling CONSULT / NOTIFY_RX / ORDER / SHIPMENT / TRIAGE; consult rejection auto-refunds
- [x] Payments (built-in, test mode) — server-side pricing + coupon validation, Stripe embedded checkout, payment webhook finalizes order then starts fulfillment, free-coupon path skips payment, test banner on checkout
- [x] FuzeRx DOB/gender collection — checkout delivery screen collects DOB + biological sex (validated 18–100)
- [x] Old provider order flow removed — src/lib/order-payload.ts, src/routes/api/create-order.ts, src/lib/orders.functions.ts deleted; pricing portal untouched
- [x] Business-logic audit delivered; card-pay finalization verified after publish (webhook hits the live URL)
- [ ] FuzeRx questionnaire ID — waiting on user/FuzeRx (support@fuzehealth.com); without it orders park in status "awaiting_questionnaire" and are logged to order_failures
- [ ] FuzeRx live key + webhook URL (needs ?key=FUZERX_WEBHOOK_KEY value) once go-live
- [x] Monthly auto-renew after the plan period (subscription checkout, renewal orders, failed-renewal logging)
- [x] Customer sign-in (email + Google) and /account with orders, plan status, billing portal
- [x] Admin discount codes (coupons table, /admin screen); old provider coupon API removed
- [x] Unpaid orders expire to "abandoned" after 24h; /travis only counts paid orders
- [x] New products from FuzeRx catalog (TRT, HRT, Anti-Aging, Sexual Health)
- [x] Testosterone products
- [x] Anti-Aging + Sexual Health
- [x] Labeled product photos
- [ ] FuzeRx questionnaire IDs for TRT/HRT/Anti-Aging/ED programs (waiting on FuzeRx)

## Marketing
- [x] Launch LegacyRX blog with index, reusable article pages, three educational posts, and site navigation
- [x] Klaviyo email gate on /qualify — email step fires identify + "Started Assessment" (source: qualify_page); Klaviyo script live with Site ID S6Pyjq
- [ ] Klaviyo delivery check from a real browser / live site (headless preview is flagged as a bot by Klaviyo, so it queues but won't send)
- [ ] Create a LegacyRx business mailbox in Hostinger, verify it as the Klaviyo sender, and populate Email A1–A5 (owner access and launch-kit copy required)
- [x] Marketing channels research saved (ads blocked without certifications; affiliate = best ROI)
- [x] Creator outreach message drafted (marketing/creator-outreach-message.md)
- [x] Creator shortlist researched + saved (marketing/legacyrx-creator-shortlist-2026-10-04.md) — verify ⚠️ handles on-platform before outreach
- [ ] Creator outreach: pick 3–5 creators, personalize messages, conflict-check sponsors (owner action)
- [x] Local/offline advertising plan for Lexington SC — saved (marketing/legacyrx-local-lexington-sc-2026-10-04.md); owner confirmed doctors hold SC licenses
- [ ] Draft gym/med-spa referral pitch + printable QR referral card (offered)
- [x] Stripe decision (Oct 5) — left parked, unlinked, for historic orders only; FuseHealth is merchant of record for new orders

## Pending: billboard advertising research (Oct 4)
- [x] Billboard research done (see Files: marketing/legacyrx-billboard-research-2026-10-04.md). Decision on spend pending user.

## Pending: blog posts from prepared drafts (Oct 4)
- [x] Post 1 added (/blog/compounded-semaglutide-vs-ozempic) with exact title/slug/meta; body drafted by AI — pending legacyrx-blog-post-1-publish.md from user to swap in exact copy
- [x] Post 2 added (/blog/glp1-flat-pricing-dose) with exact title/slug/meta; body drafted by AI — pending legacyrx-blog-post-2-publish.md from user to swap in exact copy
- [x] Switch orders to FuseHealth hosted intake + payment (/start/$med, Brand API webhook)
- [ ] Confirm FuseHealth form shows inside legacyrx.net after publish (Fuse may need the domain allowed) — waits on publish
- [x] AI "Stuck while ordering?" helper on assessment + order pages (non-medical guidance)
- [ ] Tirzepatide, testosterone, enclomiphene, NAD+ and sexual-health programs are switched off in FuseHealth — owner must reactivate (only Semaglutide accepts orders)
