-- One verified account owns each normalized email, even when it has no orders yet.
CREATE TABLE public.account_email_claims (
  email text PRIMARY KEY,
  user_id uuid NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT account_email_claims_normalized_email CHECK (email = lower(btrim(email)) AND email <> '')
);
ALTER TABLE public.account_email_claims ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.account_email_claims TO service_role;

-- Called only from a server handler using the service role. Read the current
-- Auth record in the same transaction that claims orders and subscriptions.
CREATE FUNCTION public.claim_verified_guest_records(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _email text;
  _owner uuid;
BEGIN
  SELECT lower(btrim(email)) INTO _email
  FROM auth.users
  WHERE id = _user_id AND email_confirmed_at IS NOT NULL;
  IF _email IS NULL OR _email = '' THEN
    RAISE EXCEPTION 'A confirmed email address is required';
  END IF;

  -- Serialize claims for the same email, including when there are no rows yet.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(_email, 0));
  SELECT user_id INTO _owner FROM public.account_email_claims WHERE email = _email;
  IF _owner IS NOT NULL AND _owner <> _user_id THEN
    RAISE EXCEPTION 'This email is linked to another account';
  END IF;
  IF EXISTS (SELECT 1 FROM public.orders WHERE lower(btrim(email)) = _email AND user_id IS NOT NULL AND user_id <> _user_id)
     OR EXISTS (SELECT 1 FROM public.subscriptions WHERE lower(btrim(email)) = _email AND user_id IS NOT NULL AND user_id <> _user_id) THEN
    RAISE EXCEPTION 'Records for this email are linked to another account';
  END IF;

  INSERT INTO public.account_email_claims(email, user_id) VALUES (_email, _user_id)
  ON CONFLICT (email) DO NOTHING;
  UPDATE public.orders SET user_id = _user_id
  WHERE user_id IS NULL AND lower(btrim(email)) = _email;
  UPDATE public.subscriptions SET user_id = _user_id
  WHERE user_id IS NULL AND lower(btrim(email)) = _email;
  RETURN _email;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_verified_guest_records(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_verified_guest_records(uuid) TO service_role;

-- A provider session must identify at most one order.
CREATE UNIQUE INDEX orders_fuse_session_id_uidx ON public.orders(fuse_session_id) WHERE fuse_session_id IS NOT NULL;
CREATE UNIQUE INDEX orders_stripe_session_id_uidx ON public.orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
