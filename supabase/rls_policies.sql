-- ============================================================
-- किसान जुताई — Row Level Security Policies
-- Run this AFTER schema.sql
-- ============================================================

-- Helper: get role of current logged in user
create or replace function auth_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function is_admin()
returns boolean as $$
  select auth_role() = 'admin';
$$ language sql stable security definer;

-- ============================================================
-- PROFILES
-- ============================================================
alter table profiles enable row level security;

create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or is_admin());

create policy "profiles_insert_own" on profiles
  for insert with check (id = auth.uid());

create policy "profiles_update_own_or_admin" on profiles
  for update using (id = auth.uid() or is_admin());

-- ============================================================
-- FARMERS
-- ============================================================
alter table farmers enable row level security;

create policy "farmers_select_own_or_admin" on farmers
  for select using (id = auth.uid() or is_admin() or
    -- Driver assigned to a booking can see basic farmer info
    exists (
      select 1 from bookings b
      join drivers d on d.id = b.assigned_driver_id
      where b.farmer_id = farmers.id and d.id = auth.uid()
    )
  );

create policy "farmers_insert_own" on farmers
  for insert with check (id = auth.uid());

create policy "farmers_update_own_or_admin" on farmers
  for update using (id = auth.uid() or is_admin());

-- ============================================================
-- FARMS
-- ============================================================
alter table farms enable row level security;

create policy "farms_select_own_or_admin" on farms
  for select using (
    farmer_id = auth.uid() or is_admin() or
    exists (
      select 1 from bookings b
      join booking_items bi on bi.booking_id = b.id
      where bi.farm_id = farms.id and b.assigned_driver_id = auth.uid()
    )
  );

create policy "farms_insert_own" on farms
  for insert with check (farmer_id = auth.uid());

create policy "farms_update_own_or_admin" on farms
  for update using (farmer_id = auth.uid() or is_admin());

create policy "farms_delete_own_or_admin" on farms
  for delete using (farmer_id = auth.uid() or is_admin());

-- ============================================================
-- DRIVERS
-- ============================================================
alter table drivers enable row level security;

create policy "drivers_select_own_admin_or_assigned_farmer" on drivers
  for select using (
    id = auth.uid() or is_admin() or
    exists (
      select 1 from bookings b
      where b.assigned_driver_id = drivers.id and b.farmer_id = auth.uid()
    ) or
    -- drivers can see other approved drivers' names for leaderboard
    (auth_role() = 'driver' and approval_status = 'approved')
  );

create policy "drivers_insert_own" on drivers
  for insert with check (id = auth.uid());

create policy "drivers_update_own_or_admin" on drivers
  for update using (id = auth.uid() or is_admin());

-- ============================================================
-- VILLAGE_NEIGHBORS (admin managed, everyone can read)
-- ============================================================
alter table village_neighbors enable row level security;

create policy "village_neighbors_select_all" on village_neighbors
  for select using (true);

create policy "village_neighbors_write_admin" on village_neighbors
  for all using (is_admin()) with check (is_admin());

-- ============================================================
-- SERVICES (public read, admin write)
-- ============================================================
alter table services enable row level security;

create policy "services_select_all" on services
  for select using (true);

create policy "services_write_admin" on services
  for all using (is_admin()) with check (is_admin());

-- ============================================================
-- SUBSCRIPTION_PLANS (public read, admin write)
-- ============================================================
alter table subscription_plans enable row level security;

create policy "sub_plans_select_all" on subscription_plans
  for select using (true);

create policy "sub_plans_write_admin" on subscription_plans
  for all using (is_admin()) with check (is_admin());

-- ============================================================
-- FARMER_SUBSCRIPTIONS
-- ============================================================
alter table farmer_subscriptions enable row level security;

create policy "farmer_subs_select_own_or_admin" on farmer_subscriptions
  for select using (farmer_id = auth.uid() or is_admin());

create policy "farmer_subs_insert_own" on farmer_subscriptions
  for insert with check (farmer_id = auth.uid());

create policy "farmer_subs_update_own_or_admin" on farmer_subscriptions
  for update using (farmer_id = auth.uid() or is_admin());

alter table farmer_subscription_farms enable row level security;

create policy "farmer_sub_farms_select" on farmer_subscription_farms
  for select using (
    exists (select 1 from farmer_subscriptions fs where fs.id = subscription_id and (fs.farmer_id = auth.uid() or is_admin()))
  );

create policy "farmer_sub_farms_insert" on farmer_subscription_farms
  for insert with check (
    exists (select 1 from farmer_subscriptions fs where fs.id = subscription_id and fs.farmer_id = auth.uid())
  );

-- ============================================================
-- BOOKINGS
-- ============================================================
alter table bookings enable row level security;

create policy "bookings_select_farmer_driver_admin" on bookings
  for select using (
    farmer_id = auth.uid() or assigned_driver_id = auth.uid() or is_admin() or
    -- nearby drivers who received a notification for this booking can see it before accepting
    exists (
      select 1 from booking_notifications_log bnl
      where bnl.booking_id = bookings.id and bnl.driver_id = auth.uid()
    )
  );

create policy "bookings_insert_own_farmer" on bookings
  for insert with check (farmer_id = auth.uid());

create policy "bookings_update_farmer_driver_admin" on bookings
  for update using (
    farmer_id = auth.uid() or assigned_driver_id = auth.uid() or is_admin()
  );

-- ============================================================
-- BOOKING_ITEMS
-- ============================================================
alter table booking_items enable row level security;

create policy "booking_items_select" on booking_items
  for select using (
    exists (
      select 1 from bookings b
      where b.id = booking_id and (b.farmer_id = auth.uid() or b.assigned_driver_id = auth.uid() or is_admin())
    )
  );

create policy "booking_items_insert" on booking_items
  for insert with check (
    exists (select 1 from bookings b where b.id = booking_id and b.farmer_id = auth.uid())
  );

-- ============================================================
-- BOOKING_NOTIFICATIONS_LOG
-- ============================================================
alter table booking_notifications_log enable row level security;

create policy "booking_notif_log_select" on booking_notifications_log
  for select using (driver_id = auth.uid() or is_admin());

create policy "booking_notif_log_insert_system" on booking_notifications_log
  for insert with check (is_admin()); -- inserted via server-side function/service role

-- ============================================================
-- BOOKING_STATUS_HISTORY
-- ============================================================
alter table booking_status_history enable row level security;

create policy "booking_status_history_select" on booking_status_history
  for select using (
    exists (
      select 1 from bookings b
      where b.id = booking_id and (b.farmer_id = auth.uid() or b.assigned_driver_id = auth.uid() or is_admin())
    )
  );

-- ============================================================
-- BOOKING_COMPLETION_PHOTOS
-- ============================================================
alter table booking_completion_photos enable row level security;

create policy "completion_photos_select" on booking_completion_photos
  for select using (
    exists (
      select 1 from bookings b
      where b.id = booking_id and (b.farmer_id = auth.uid() or b.assigned_driver_id = auth.uid() or is_admin())
    )
  );

create policy "completion_photos_insert_driver" on booking_completion_photos
  for insert with check (
    exists (select 1 from bookings b where b.id = booking_id and b.assigned_driver_id = auth.uid())
  );

-- ============================================================
-- PAYMENTS
-- ============================================================
alter table payments enable row level security;

create policy "payments_select_own_or_admin" on payments
  for select using (farmer_id = auth.uid() or is_admin());

create policy "payments_insert_own" on payments
  for insert with check (farmer_id = auth.uid());

create policy "payments_update_own_or_admin" on payments
  for update using (farmer_id = auth.uid() or is_admin());

-- ============================================================
-- CHAT_MESSAGES
-- ============================================================
alter table chat_messages enable row level security;

create policy "chat_select_participants" on chat_messages
  for select using (
    exists (
      select 1 from bookings b
      where b.id = booking_id and (b.farmer_id = auth.uid() or b.assigned_driver_id = auth.uid())
    ) or is_admin()
  );

create policy "chat_insert_participants" on chat_messages
  for insert with check (
    sender_id = auth.uid() and
    exists (
      select 1 from bookings b
      where b.id = booking_id and (b.farmer_id = auth.uid() or b.assigned_driver_id = auth.uid())
    )
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
alter table notifications enable row level security;

create policy "notifications_select_own" on notifications
  for select using (
    recipient_id = auth.uid() or is_admin() or
    (target_type = 'village' and target_village = (
      select village from farmers where id = auth.uid()
      union
      select village from drivers where id = auth.uid()
      limit 1
    )) or
    (target_type = 'all')
  );

create policy "notifications_update_own" on notifications
  for update using (recipient_id = auth.uid());

create policy "notifications_insert_admin" on notifications
  for insert with check (is_admin());

-- ============================================================
-- LEADERBOARD SNAPSHOTS (public read for drivers, admin write)
-- ============================================================
alter table driver_leaderboard_snapshots enable row level security;

create policy "leaderboard_select_all" on driver_leaderboard_snapshots
  for select using (true);

create policy "leaderboard_write_admin" on driver_leaderboard_snapshots
  for all using (is_admin()) with check (is_admin());

-- ============================================================
-- AUDIT LOGS (admin only)
-- ============================================================
alter table audit_logs enable row level security;

create policy "audit_logs_select_admin" on audit_logs
  for select using (is_admin());

create policy "audit_logs_insert_all" on audit_logs
  for insert with check (auth.uid() is not null);

-- ============================================================
-- STORAGE BUCKETS (run in Supabase Dashboard > Storage, or via SQL)
-- ============================================================
-- These are set to public=true because the app reads files via
-- supabase.storage.getPublicUrl() everywhere (document viewers, chat
-- images, completion photos). Uploads remain restricted: the INSERT
-- policy below only allows writing into a folder named after the
-- uploader's own auth.uid(), so no one can overwrite or add files to
-- another user's folder even though the bucket is public for reads.
insert into storage.buckets (id, name, public)
values
  ('aadhar-documents', 'aadhar-documents', true),
  ('farm-documents', 'farm-documents', true),
  ('driver-documents', 'driver-documents', true),
  ('completion-photos', 'completion-photos', true),
  ('chat-images', 'chat-images', true)
on conflict (id) do update set public = true;

-- Storage policies: users can upload to their own folder (path prefix = their uid)
create policy "storage_own_folder_insert" on storage.objects
  for insert with check (
    bucket_id in ('aadhar-documents','farm-documents','driver-documents','completion-photos','chat-images')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public buckets already serve GET requests without checking RLS, but this
-- policy is kept so that any admin tooling querying storage.objects directly
-- (rather than via the public URL) still resolves correctly.
create policy "storage_own_folder_select" on storage.objects
  for select using (
    bucket_id in ('aadhar-documents','farm-documents','driver-documents','completion-photos','chat-images')
    and ((storage.foldername(name))[1] = auth.uid()::text or is_admin())
  );

-- ============================================================
-- END OF RLS POLICIES
-- ============================================================
