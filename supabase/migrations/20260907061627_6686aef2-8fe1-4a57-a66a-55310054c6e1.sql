CREATE TABLE public.order_failures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text,
  email text,
  first_name text,
  last_name text,
  phone text,
  state text,
  medication text,
  plan_id text,
  product_id text,
  coupon_code text,
  amount numeric(10,2),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.order_failures TO service_role;

ALTER TABLE public.order_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_failures_service_only" ON public.order_failures FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX order_failures_created_at_idx ON public.order_failures (created_at DESC);