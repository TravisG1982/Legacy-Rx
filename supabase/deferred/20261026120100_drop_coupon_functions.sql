-- Step 2 of 2. Apply only AFTER the code that no longer calls these functions is
-- deployed: the previous deployment's coupon admin screen calls the first two.
-- Only functions are removed. The `coupons` table, `orders.coupon_code` and
-- `discount`, `admin_roles.manage_coupons`, the `subscriptions` table and all
-- `fuzerx_*` / `stripe_*` order columns stay until historical data needs are
-- confirmed (see supabase/DATABASE.md, "Deferred cleanup").
DROP FUNCTION IF EXISTS public.save_admin_coupon(uuid, uuid, text, text, numeric, boolean, timestamptz, integer, text[]);
DROP FUNCTION IF EXISTS public.delete_admin_coupon(uuid, uuid);
DROP FUNCTION IF EXISTS public.redeem_coupon(text);
