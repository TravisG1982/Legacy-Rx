-- Test-mode Stripe payments for LegacyRX. Separate from `orders` so FuseHealth
-- orders are never read or changed by this path. Contains no medical answers.
CREATE TABLE public.payment_test_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text NOT NULL UNIQUE,
  email text NOT NULL,
  medication text NOT NULL,
  plan_id text NOT NULL,
  -- Amount fixed by the server from the catalog when the order is created.
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'usd' CHECK (currency = 'usd'),
  status text NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'abandoned', 'payment_failed', 'authorized', 'paid', 'order_error')),
  -- SHA-256 of the unguessable token returned to the buyer's browser.
  access_token_hash text NOT NULL,
  stripe_session_id text UNIQUE,
  stripe_payment_intent_id text,
  last_event text,
  last_event_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- At most one open attempt per buyer and product, so a double click cannot create two orders.
CREATE UNIQUE INDEX payment_test_orders_one_pending
  ON public.payment_test_orders (lower(email), medication, plan_id)
  WHERE status IN ('pending_payment', 'payment_failed');

CREATE TRIGGER payment_test_orders_set_updated_at BEFORE UPDATE ON public.payment_test_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payment_test_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_test_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_test_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_test_orders, public.payment_test_webhook_events FROM public, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payment_test_orders TO service_role;
GRANT SELECT, INSERT ON public.payment_test_webhook_events TO service_role;

-- Applies one verified Stripe event atomically: records the event id, then moves the order
-- forward only. Rolling back on error means the id is not consumed and Stripe retries.
-- Rank: pending 0 < abandoned/payment_failed 1 < authorized 2 < paid 3 < order_error 4.
CREATE FUNCTION public.apply_payment_test_event(
  p_event_id text,
  p_event_type text,
  p_order_id uuid,
  p_session_id text,
  p_payment_intent_id text,
  p_target_status text,
  p_amount_cents bigint,
  p_currency text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  o public.payment_test_orders%ROWTYPE;
  new_status text := p_target_status;
  old_rank integer;
  new_rank integer;
  inserted integer;
BEGIN
  IF p_target_status NOT IN ('pending_payment', 'abandoned', 'payment_failed', 'authorized', 'paid') THEN
    RAISE EXCEPTION 'invalid target status' USING errcode = '22023';
  END IF;

  INSERT INTO public.payment_test_webhook_events (event_id, event_type)
  VALUES (p_event_id, p_event_type) ON CONFLICT (event_id) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF inserted = 0 THEN RETURN 'duplicate'; END IF;

  SELECT * INTO o FROM public.payment_test_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order not found' USING errcode = 'P0002';
  END IF;

  IF p_session_id IS NOT NULL AND o.stripe_session_id IS NOT NULL AND o.stripe_session_id <> p_session_id THEN
    RETURN 'ignored';
  END IF;

  IF p_session_id IS NULL AND p_payment_intent_id IS NOT NULL AND o.stripe_payment_intent_id IS NOT NULL
     AND o.stripe_payment_intent_id <> p_payment_intent_id THEN
    IF o.status = 'paid' OR o.status = 'order_error' THEN RETURN 'ignored'; END IF;
    -- A new PI from a retry may reach us before Checkout reports its binding.
    -- Roll back the event ID so Stripe can redeliver after the session event.
    RAISE EXCEPTION 'payment intent not bound yet' USING errcode = 'P0002';
  END IF;

  IF p_session_id IS NULL AND p_payment_intent_id IS NULL THEN
    RETURN 'ignored';
  END IF;

  -- PaymentIntent events contain no Checkout Session id. Wait until a signed
  -- session event has bound the PI to this order; Stripe will retry this event.
  IF p_session_id IS NULL AND o.stripe_payment_intent_id IS NULL THEN
    RAISE EXCEPTION 'payment intent not bound yet' USING errcode = 'P0002';
  END IF;

  IF new_status IN ('authorized', 'paid')
     AND (p_amount_cents IS DISTINCT FROM o.amount_cents::bigint OR lower(coalesce(p_currency, '')) <> o.currency) THEN
    new_status := 'order_error';
  END IF;

  old_rank := CASE o.status WHEN 'pending_payment' THEN 0 WHEN 'abandoned' THEN 1 WHEN 'payment_failed' THEN 1
                            WHEN 'authorized' THEN 2 WHEN 'paid' THEN 3 ELSE 4 END;
  new_rank := CASE new_status WHEN 'pending_payment' THEN 0 WHEN 'abandoned' THEN 1 WHEN 'payment_failed' THEN 1
                              WHEN 'authorized' THEN 2 WHEN 'paid' THEN 3 ELSE 4 END;

  UPDATE public.payment_test_orders SET
    stripe_session_id = coalesce(stripe_session_id, p_session_id),
    -- A signed event for the *same* Checkout session can identify a new PI
    -- after a retry. Never rebind an already-paid order from a late event.
    stripe_payment_intent_id = CASE
      WHEN p_session_id IS NOT NULL AND p_payment_intent_id IS NOT NULL AND o.status <> 'paid' THEN p_payment_intent_id
      ELSE coalesce(stripe_payment_intent_id, p_payment_intent_id)
    END
  WHERE id = o.id;

  IF new_rank <= old_rank THEN RETURN 'ignored'; END IF;

  UPDATE public.payment_test_orders
  SET status = new_status, last_event = p_event_type, last_event_id = p_event_id
  WHERE id = o.id;
  RETURN CASE WHEN new_status = 'order_error' THEN 'mismatch' ELSE 'applied' END;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_payment_test_event(text, text, uuid, text, text, text, bigint, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_payment_test_event(text, text, uuid, text, text, text, bigint, text) TO service_role;
