-- A declined card emits payment_intent.payment_failed while Checkout is still open.
-- No checkout.session.completed event has bound the PaymentIntent yet. Accept the
-- first signed failure only for an order with a stored Checkout Session and the
-- expected amount/currency; retain the stricter binding for success events.
CREATE OR REPLACE FUNCTION public.apply_payment_test_event(
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
    -- A later declined attempt cannot lower an already-failed order. Acknowledge
    -- it without replacing the PI binding or accumulating Stripe retries.
    IF new_status = 'payment_failed' AND o.status = 'payment_failed' THEN RETURN 'ignored'; END IF;
    -- A new PI from a retry may reach us before Checkout reports its binding.
    -- Roll back the event ID so Stripe can redeliver after the session event.
    RAISE EXCEPTION 'payment intent not bound yet' USING errcode = 'P0002';
  END IF;

  IF p_session_id IS NULL AND p_payment_intent_id IS NULL THEN
    RETURN 'ignored';
  END IF;

  -- A declined card leaves Checkout open, so it has no completed-session event
  -- to bind the PI. Its signed failure may bind the first PI only if our own
  -- session is already stored and the amount/currency match. Success and
  -- authorization still require a signed Checkout session event first.
  IF p_session_id IS NULL AND o.stripe_payment_intent_id IS NULL THEN
    IF NOT (p_event_type = 'payment_intent.payment_failed'
      AND new_status = 'payment_failed'
      AND o.stripe_session_id IS NOT NULL
      AND o.status IN ('pending_payment', 'payment_failed')
      AND p_amount_cents = o.amount_cents::bigint
      AND lower(coalesce(p_currency, '')) = o.currency) THEN
      RAISE EXCEPTION 'payment intent not bound yet' USING errcode = 'P0002';
    END IF;
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
