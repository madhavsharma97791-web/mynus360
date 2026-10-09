
create or replace function public.transition_order(p_order uuid, p_to text, p_reason text default null)
returns public.orders language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  my_name text;
  cur public.orders;
  old_status text;
  allowed text[];
begin
  if me is null or not public.is_active_staff(me) then raise exception 'Not allowed'; end if;
  select coalesce(nullif(full_name,''), email) into my_name from public.profiles where id = me;
  select * into cur from public.orders where id = p_order for update;
  if not found then raise exception 'Order not found'; end if;
  old_status := cur.status;
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
    values (p_order, old_status, p_to, me, my_name, p_reason);
  return cur;
end $$;
revoke all on function public.transition_order(uuid, text, text) from public, anon;
grant execute on function public.transition_order(uuid, text, text) to authenticated;
