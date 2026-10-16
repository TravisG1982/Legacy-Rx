ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fuse_order_id text, ADD COLUMN IF NOT EXISTS fuse_session_id text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_fuse_order_id_key ON public.orders (fuse_order_id) WHERE fuse_order_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.fuse_webhook_events (
  idempotency_key text PRIMARY KEY,
  event text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.fuse_webhook_events TO service_role;
ALTER TABLE public.fuse_webhook_events ENABLE ROW LEVEL SECURITY;