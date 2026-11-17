-- Delivery receipt only. No mutation of orders, payment records or clinical state.
CREATE TABLE public.beluga_visits (
  master_id text PRIMARY KEY CHECK (master_id ~ '^[A-Za-z0-9_-]{1,200}$'),
  environment text NOT NULL CHECK (environment IN ('test', 'live')),
  order_id uuid REFERENCES public.orders(id),
  test_reference text CHECK (test_reference ~ '^[A-Za-z0-9_-]{1,100}$'),
  creation_status text NOT NULL DEFAULT 'pending'
    CHECK (creation_status IN ('pending', 'created', 'uncertain', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  beluga_created_at timestamptz,
  CHECK (environment <> 'live' OR order_id IS NOT NULL),
  CHECK (order_id IS NOT NULL OR test_reference IS NOT NULL),
  CHECK ((creation_status = 'created') = (beluga_created_at IS NOT NULL)),
  UNIQUE (master_id, environment)
);

CREATE TABLE public.beluga_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id text NOT NULL,
  environment text NOT NULL,
  event text NOT NULL CHECK (event IN ('FORM_SUBMITTED', 'RX_WRITTEN', 'CONSULT_CONCLUDED', 'CONSULT_CANCELED')),
  received_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  fingerprint text NOT NULL CHECK (fingerprint ~ '^[a-f0-9]{64}$'),
  possible_duplicate boolean NOT NULL,
  FOREIGN KEY (master_id, environment) REFERENCES public.beluga_visits(master_id, environment),
  CHECK ((payload ->> 'masterId') IS NOT DISTINCT FROM master_id),
  CHECK ((payload ->> 'event') IS NOT DISTINCT FROM event),
  CHECK (event <> 'CONSULT_CONCLUDED' OR
    coalesce(payload ->> 'visitOutcome' IN ('prescribed', 'referred'), false))
);
CREATE INDEX beluga_webhook_events_fingerprint
  ON public.beluga_webhook_events (master_id, environment, fingerprint);

ALTER TABLE public.beluga_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beluga_webhook_events ENABLE ROW LEVEL SECURITY;
-- Also clear any Supabase default grants inherited by newly created tables.
REVOKE ALL ON public.beluga_visits, public.beluga_webhook_events FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.beluga_visits TO service_role;
GRANT SELECT ON public.beluga_webhook_events TO service_role;

CREATE FUNCTION public.receive_beluga_webhook(p_environment text, p_payload jsonb, p_fingerprint text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  visit public.beluga_visits%ROWTYPE;
  repeated boolean;
BEGIN
  -- Serialize deliveries for one visit, including simultaneous identical POSTs.
  -- Locking and INSERT share a transaction; a failed INSERT cannot consume receipt.
  SELECT * INTO visit FROM public.beluga_visits
    WHERE master_id = p_payload ->> 'masterId' AND environment = p_environment
    FOR UPDATE;
  IF NOT FOUND OR visit.creation_status = 'failed' THEN RETURN 'visit_unavailable'; END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.beluga_webhook_events
    WHERE master_id = visit.master_id AND environment = p_environment AND fingerprint = p_fingerprint
  ) INTO repeated;
  INSERT INTO public.beluga_webhook_events(master_id, environment, event, payload, fingerprint, possible_duplicate)
    VALUES (visit.master_id, p_environment, p_payload ->> 'event', p_payload, p_fingerprint, repeated);
  -- Do not drop equal payloads: Beluga has not specified a stable event id.
  RETURN CASE WHEN repeated THEN 'possible_duplicate' ELSE 'stored' END;
END;
$$;
REVOKE ALL ON FUNCTION public.receive_beluga_webhook(text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.receive_beluga_webhook(text, jsonb, text) TO service_role;
