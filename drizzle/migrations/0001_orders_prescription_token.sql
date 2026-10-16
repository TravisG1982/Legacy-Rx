ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fuzerx_prescription_token text;