-- ============================================================
-- किसान जुताई — Phase 4: Push Notification Subscriptions
-- Run this in Supabase SQL Editor AFTER previous migrations
-- ============================================================

create table push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index idx_push_subscriptions_user on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

create policy "push_subscriptions_own" on push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "push_subscriptions_admin_read" on push_subscriptions
  for select using (is_admin());

-- Enable Realtime on tables the app subscribes to live
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table bookings;
alter publication supabase_realtime add table booking_notifications_log;
alter publication supabase_realtime add table notifications;
