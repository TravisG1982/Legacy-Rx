-- Coupon mutations and their audit records must commit or roll back together.
create function public.save_admin_coupon(
  p_actor_id uuid,
  p_coupon_id uuid,
  p_code text,
  p_type text,
  p_amount numeric,
  p_active boolean,
  p_expires_at timestamptz,
  p_max_uses integer,
  p_meds text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id uuid;
begin
  if not exists (
    select 1 from public.admin_roles r
    join auth.users u on u.id = r.user_id
    where r.user_id = p_actor_id and u.email_confirmed_at is not null
      and (r.role = 'owner' or (r.role = 'staff' and r.manage_coupons))
  ) then
    raise exception 'admin permission revoked' using errcode = '42501';
  end if;

  if p_coupon_id is null then
    insert into public.coupons (code, type, amount, active, expires_at, max_uses, meds)
    values (p_code, p_type, p_amount, p_active, p_expires_at, p_max_uses, p_meds)
    returning id into saved_id;
  else
    update public.coupons
    set code = p_code, type = p_type, amount = p_amount, active = p_active,
        expires_at = p_expires_at, max_uses = p_max_uses, meds = p_meds
    where id = p_coupon_id
    returning id into saved_id;
    if saved_id is null then
      raise exception 'coupon not found' using errcode = 'P0002';
    end if;
  end if;

  insert into public.admin_audit_log(actor_id, action, object_type, object_id, result)
  values (p_actor_id, 'save_coupon', 'coupon', saved_id::text, 'success');
  return saved_id;
end;
$$;

revoke all on function public.save_admin_coupon(uuid, uuid, text, text, numeric, boolean, timestamptz, integer, text[]) from public, anon, authenticated;
grant execute on function public.save_admin_coupon(uuid, uuid, text, text, numeric, boolean, timestamptz, integer, text[]) to service_role;

create function public.delete_admin_coupon(p_actor_id uuid, p_coupon_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.admin_roles r
    join auth.users u on u.id = r.user_id
    where r.user_id = p_actor_id and u.email_confirmed_at is not null
      and (r.role = 'owner' or (r.role = 'staff' and r.manage_coupons))
  ) then
    raise exception 'admin permission revoked' using errcode = '42501';
  end if;

  delete from public.coupons where id = p_coupon_id;
  if not found then
    raise exception 'coupon not found' using errcode = 'P0002';
  end if;
  insert into public.admin_audit_log(actor_id, action, object_type, object_id, result)
  values (p_actor_id, 'delete_coupon', 'coupon', p_coupon_id::text, 'success');
end;
$$;

revoke all on function public.delete_admin_coupon(uuid, uuid) from public, anon, authenticated;
grant execute on function public.delete_admin_coupon(uuid, uuid) to service_role;
