CREATE TABLE public.funnel_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  state TEXT,
  age_18 TEXT,
  on_glp1 TEXT,
  email_consent BOOLEAN NOT NULL DEFAULT false,
  sms_transactional_consent BOOLEAN NOT NULL DEFAULT false,
  sms_marketing_consent BOOLEAN NOT NULL DEFAULT false,
  stage TEXT NOT NULL DEFAULT 'unregistered',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.funnel_leads TO service_role;

ALTER TABLE public.funnel_leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX funnel_leads_created_at_idx ON public.funnel_leads (created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER funnel_leads_set_updated_at
BEFORE UPDATE ON public.funnel_leads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();