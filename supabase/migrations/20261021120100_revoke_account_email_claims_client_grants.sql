-- Supabase may grant new public tables to API roles by default. Keep this
-- ownership registry accessible only to the server-side service role.
REVOKE ALL ON TABLE public.account_email_claims FROM PUBLIC, anon, authenticated;
