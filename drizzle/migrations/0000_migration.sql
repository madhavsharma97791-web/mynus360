
create type public.app_role as enum ('owner', 'worker');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_active_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles r join public.profiles p on p.id = r.user_id
    where r.user_id = _user_id and p.active
  )
$$;

create policy "Own role readable" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'owner'));
create policy "Own profile or owner" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'owner'));

-- Settings (single row)
create table public.app_settings (
  id int primary key default 1 check (id = 1),
  owner_email text,
  store_name text not null default 'MYNUS 360',
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1);
grant select on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
create policy "Owner reads settings" on public.app_settings for select to authenticated
  using (public.has_role(auth.uid(), 'owner'));

-- Orders
create sequence public.order_number_seq start 1001;
grant usage on sequence public.order_number_seq to service_role;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number int not null unique default nextval('public.order_number_seq'),
  client_ref text unique,
  order_type text not null check (order_type in ('Dine In','Takeaway')),
  table_no text,
  customer_name text,
  customer_phone text,
  notes text,
  lines jsonb not null,
  subtotal int not null,
  total int not null,
  payment_method text not null check (payment_method in ('Cash','UPI')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid')),
  status text not null default 'new' check (status in ('new','preparing','ready','completed','cancelled')),
  acknowledged_at timestamptz,
  accepted_by uuid, accepted_by_name text, accepted_at timestamptz,
  ready_at timestamptz,
  completed_by uuid, completed_by_name text, completed_at timestamptz,
  cancelled_by uuid, cancelled_by_name text, cancelled_at timestamptz, cancel_reason text,
  created_at timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Owner sees all orders" on public.orders for select to authenticated
  using (public.has_role(auth.uid(), 'owner') and public.is_active_staff(auth.uid()));
create policy "Workers see recent orders" on public.orders for select to authenticated
  using (public.is_active_staff(auth.uid()) and created_at > now() - interval '3 days');

create table public.order_events (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text, to_status text not null,
  actor uuid, actor_name text, note text,
  created_at timestamptz not null default now()
);
grant select on public.order_events to authenticated;
grant all on public.order_events to service_role;
grant usage on sequence public.order_events_id_seq to service_role;
alter table public.order_events enable row level security;
create policy "Owner reads events" on public.order_events for select to authenticated
  using (public.has_role(auth.uid(), 'owner'));

-- Atomic status change
create or replace function public.transition_order(p_order uuid, p_to text, p_reason text default null)
returns public.orders language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  my_name text;
  cur public.orders;
  allowed text[];
begin
  if me is null or not public.is_active_staff(me) then raise exception 'Not allowed'; end if;
  select coalesce(nullif(full_name,''), email) into my_name from public.profiles where id = me;
  select * into cur from public.orders where id = p_order for update;
  if not found then raise exception 'Order not found'; end if;
  allowed := case cur.status
    when 'new' then array['preparing','cancelled']
    when 'preparing' then array['ready','cancelled']
    when 'ready' then array['completed','cancelled']
    else array[]::text[] end;
  if not (p_to = any(allowed)) then
    raise exception 'Order is already %', cur.status;
  end if;
  if p_to = 'cancelled' and coalesce(btrim(p_reason),'') = '' then
    raise exception 'A cancel reason is required';
  end if;
  update public.orders set
    status = p_to,
    acknowledged_at = coalesce(acknowledged_at, now()),
    accepted_by = case when p_to = 'preparing' then me else accepted_by end,
    accepted_by_name = case when p_to = 'preparing' then my_name else accepted_by_name end,
    accepted_at = case when p_to = 'preparing' then now() else accepted_at end,
    ready_at = case when p_to = 'ready' then now() else ready_at end,
    completed_by = case when p_to = 'completed' then me else completed_by end,
    completed_by_name = case when p_to = 'completed' then my_name else completed_by_name end,
    completed_at = case when p_to = 'completed' then now() else completed_at end,
    payment_status = case when p_to = 'completed' then 'paid' else payment_status end,
    cancelled_by = case when p_to = 'cancelled' then me else cancelled_by end,
    cancelled_by_name = case when p_to = 'cancelled' then my_name else cancelled_by_name end,
    cancelled_at = case when p_to = 'cancelled' then now() else cancelled_at end,
    cancel_reason = case when p_to = 'cancelled' then btrim(p_reason) else cancel_reason end
  where id = p_order returning * into cur;
  insert into public.order_events (order_id, from_status, to_status, actor, actor_name, note)
    values (p_order, (select status from public.order_events where false), p_to, me, my_name, p_reason);
  return cur;
end $$;
revoke all on function public.transition_order(uuid, text, text) from public, anon;
grant execute on function public.transition_order(uuid, text, text) to authenticated;

-- Owner claims the role only when their verified email matches the configured owner email
create or replace function public.claim_owner()
returns boolean language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  em text; confirmed timestamptz; target text;
begin
  if me is null then return false; end if;
  select email, email_confirmed_at into em, confirmed from auth.users where id = me;
  select owner_email into target from public.app_settings where id = 1;
  if target is null or confirmed is null or lower(em) <> lower(btrim(target)) then return false; end if;
  insert into public.profiles (id, email, full_name) values (me, em, 'Owner')
    on conflict (id) do update set active = true;
  insert into public.user_roles (user_id, role) values (me, 'owner') on conflict do nothing;
  return true;
end $$;
revoke all on function public.claim_owner() from public, anon;
grant execute on function public.claim_owner() to authenticated;

alter table public.orders replica identity full;
alter publication supabase_realtime add table public.orders;
