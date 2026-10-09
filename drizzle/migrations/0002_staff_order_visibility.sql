alter policy "Workers see recent orders" on public.orders using (public.is_active_staff(auth.uid()) and (created_at > now() - interval '3 days' or status in ('new','preparing','ready')));

create or replace function public.guard_staff_order_transition()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.has_role(auth.uid(), 'owner') and old.created_at <= now() - interval '3 days' and old.status not in ('new','preparing','ready') then
    raise exception 'Order is outside your accessible history';
  end if;
  return new;
end $$;
create trigger guard_staff_order_transition before update on public.orders for each row execute function public.guard_staff_order_transition();