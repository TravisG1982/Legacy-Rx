-- Step 1 of 2 for retiring FuzeRx naming. Apply BEFORE deploying the code that
-- writes `provider_last_event` (additive; the old column is left untouched, so
-- the previous deployment keeps working during the rollout).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider_last_event text;

COMMENT ON COLUMN public.orders.provider_last_event IS 'Last provider event label recorded by the current order flow (FuseHealth checkout and webhook). Replaces fuzerx_last_event.';

-- Carry existing event labels over. Idempotent: run it again after the new code
-- is live to pick up events the previous deployment wrote to the old column in
-- the meantime.
UPDATE public.orders
SET provider_last_event = fuzerx_last_event
WHERE provider_last_event IS NULL AND fuzerx_last_event IS NOT NULL;
