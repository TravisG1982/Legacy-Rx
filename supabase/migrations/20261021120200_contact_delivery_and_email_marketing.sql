ALTER TABLE public.funnel_leads
  ADD COLUMN email_marketing_consent BOOLEAN NOT NULL DEFAULT false;

-- Existing submissions have unknown delivery outcomes. New submissions set
-- pending explicitly when inserted by the application.
ALTER TABLE public.contact_messages
  ADD COLUMN delivery_status TEXT NOT NULL DEFAULT 'unconfirmed'
    CONSTRAINT contact_messages_delivery_status_check
    CHECK (delivery_status IN ('pending', 'delivering', 'accepted', 'failed', 'unconfirmed')),
  ADD COLUMN delivery_attempted_at TIMESTAMPTZ,
  ADD COLUMN delivery_accepted_at TIMESTAMPTZ;
