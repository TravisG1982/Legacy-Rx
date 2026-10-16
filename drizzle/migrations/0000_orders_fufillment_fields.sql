ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS dob text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS fuzerx_patient_token text,
  ADD COLUMN IF NOT EXISTS fuzerx_consult_id text,
  ADD COLUMN IF NOT EXISTS fuzerx_fill_request_id text,
  ADD COLUMN IF NOT EXISTS fuzerx_status text,
  ADD COLUMN IF NOT EXISTS fuzerx_last_event text,
  ADD COLUMN IF NOT EXISTS fuzerx_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_stripe_session_idx ON public.orders (stripe_session_id);
CREATE INDEX IF NOT EXISTS orders_fuzerx_consult_idx ON public.orders (fuzerx_consult_id);

COMMENT ON COLUMN public.orders.status IS 'Order lifecycle: pending_payment -> paid -> consult_sent -> prescribed -> fill_requested -> order_processing -> shipped -> delivered, or failed/consult_rejected/triage. Legacy whitelabelmd rows keep "received".';
COMMENT ON COLUMN public.orders.fuzerx_status IS 'FuzeRx fulfillment status mirrored from ORDER/SHIPMENT/CONSULT webhooks.';