-- Assign roles only through a reviewed, service-role/SQL operation using an exact Auth user ID.
create table public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'staff')),
  view_leads boolean not null default false,
  delete_leads boolean not null default false,
  view_pricing boolean not null default false,
  manage_coupons boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admin_roles_updated_at before update on public.admin_roles
for each row execute function public.set_updated_at();

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null check (length(action) between 1 and 80),
  object_type text not null check (length(object_type) between 1 and 80),
  object_id text check (object_id is null or length(object_id) <= 80),
  occurred_at timestamptz not null default now(),
  result text not null check (result in ('denied', 'success', 'failure', 'validation_error'))
);
create index admin_audit_log_actor_time on public.admin_audit_log(actor_id, occurred_at desc);

alter table public.admin_roles enable row level security;
alter table public.admin_audit_log enable row level security;
revoke all on public.admin_roles, public.admin_audit_log from public, anon, authenticated;
revoke all on sequence public.admin_audit_log_id_seq from public, anon, authenticated;
grant select, insert, update, delete on public.admin_roles to service_role;
grant select, insert on public.admin_audit_log to service_role;
grant usage, select on sequence public.admin_audit_log_id_seq to service_role;

-- A service-only RPC makes every deleted lead ID and its audit row one transaction.
create function public.delete_admin_funnel_leads(p_actor_id uuid, p_lead_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  if p_actor_id is null or p_lead_ids is null or cardinality(p_lead_ids) < 1 or cardinality(p_lead_ids) > 500 or array_position(p_lead_ids, null) is not null then
    raise exception 'invalid admin deletion request' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.admin_roles r
    join auth.users u on u.id = r.user_id
    where r.user_id = p_actor_id and u.email_confirmed_at is not null
      and (r.role = 'owner' or (r.role = 'staff' and r.delete_leads))
  ) then
    raise exception 'admin permission revoked' using errcode = '42501';
  end if;

  with deleted as (
    delete from public.funnel_leads where id = any(p_lead_ids) returning id
  ), logged as (
    insert into public.admin_audit_log(actor_id, action, object_type, object_id, result)
    select p_actor_id, 'delete_leads', 'funnel_lead', id::text, 'success' from deleted
    returning id
  )
  select count(*) into deleted_count from logged;

  if deleted_count = 0 then
    insert into public.admin_audit_log(actor_id, action, object_type, result)
    values (p_actor_id, 'delete_leads', 'funnel_lead', 'success');
  end if;
  return deleted_count;
end;
$$;

revoke all on function public.delete_admin_funnel_leads(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.delete_admin_funnel_leads(uuid, uuid[]) to service_role;
