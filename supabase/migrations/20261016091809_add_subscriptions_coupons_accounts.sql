ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_invoice_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_renewal boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_invoice_uidx ON public.orders(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_email_idx ON public.orders(lower(email));

CREATE TABLE public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  medication text,
  price_id text not null,
  first_order_number text,
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  environment text not null default 'sandbox',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE INDEX subscriptions_email_idx ON public.subscriptions(lower(email));
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_service_only ON public.subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  type text not null check (type in ('percent','fixed','fixed_total')),
  amount numeric not null check (amount >= 0),
  active boolean not null default true,
  expires_at timestamptz,
  max_uses integer,
  uses integer not null default 0,
  meds text[] not null default '{sema,tirz}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE UNIQUE INDEX coupons_code_uidx ON public.coupons(lower(code));
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY coupons_service_only ON public.coupons FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER coupons_set_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.redeem_coupon(_code text) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.coupons SET uses = uses + 1 WHERE lower(code) = lower(_code);
$$;
REVOKE ALL ON FUNCTION public.redeem_coupon(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text) TO service_role;