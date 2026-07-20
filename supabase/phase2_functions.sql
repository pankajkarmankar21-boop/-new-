-- ============================================================
-- किसान जुताई — Phase 2: Booking Assignment Function
-- Run this in Supabase SQL Editor AFTER schema.sql + rls_policies.sql
-- ============================================================

-- Finds all approved, available drivers whose village matches either
-- the farmer's village OR any village listed in village_neighbors for
-- the farms included in this booking, then creates a notification +
-- a booking_notifications_log row for each (used by RLS to let a driver
-- see a pending booking before they've accepted it).
create or replace function notify_nearby_drivers(p_booking_id uuid)
returns void as $$
declare
  v_farmer_village text;
  v_target_villages text[];
begin
  -- Villages of every farm included in this booking, plus the farmer's home village
  select array_agg(distinct v) into v_target_villages
  from (
    select f.village as v
    from booking_items bi
    join farms f on f.id = bi.farm_id
    where bi.booking_id = p_booking_id
    union
    select fa.village
    from bookings b
    join farmers fa on fa.id = b.farmer_id
    where b.id = p_booking_id
  ) villages;

  -- Expand to neighboring villages too
  select array_agg(distinct village) into v_target_villages
  from (
    select unnest(v_target_villages) as village
    union
    select vn.neighbor_village
    from village_neighbors vn
    where vn.village = any(v_target_villages)
  ) expanded;

  -- Insert notification log + notification row for each matching driver
  insert into booking_notifications_log (booking_id, driver_id)
  select p_booking_id, d.id
  from drivers d
  where d.village = any(v_target_villages)
    and d.approval_status = 'approved'
    and d.is_available = true
  on conflict (booking_id, driver_id) do nothing;

  insert into notifications (target_type, recipient_id, title, body, data)
  select
    'driver',
    d.id,
    'नवीन बुकिंग उपलब्ध',
    'तुमच्या गावाजवळ नवीन काम आहे. लगेच पहा आणि स्वीकारा.',
    jsonb_build_object('booking_id', p_booking_id, 'type', 'new_booking')
  from drivers d
  where d.village = any(v_target_villages)
    and d.approval_status = 'approved'
    and d.is_available = true;
end;
$$ language plpgsql security definer;

-- Only the service role (server-side API) should call this directly;
-- it's invoked via admin client after payment confirmation.
revoke execute on function notify_nearby_drivers(uuid) from public, anon, authenticated;
