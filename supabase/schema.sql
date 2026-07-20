-- ============================================================
-- किसान जुताई — Complete Production Database Schema
-- Supabase (PostgreSQL)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- fast search

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('farmer', 'driver', 'admin');
create type approval_status as enum ('pending', 'approved', 'rejected');
create type booking_status as enum (
  'pending',        -- Farmer ने booking केली, driver ला notification गेली
  'accepted',        -- Driver ने accept केली
  'rejected',        -- Driver ने reject केली
  'started',         -- निघालो
  'reached',         -- पोहोचलो
  'in_progress',     -- काम सुरू
  'completed',       -- काम पूर्ण
  'cancelled'
);
create type payment_status as enum ('pending', 'success', 'failed', 'refunded');
create type payment_method as enum ('upi', 'card', 'netbanking', 'wallet', 'qr');
create type notification_target as enum ('farmer', 'driver', 'village', 'all');
create type service_unit as enum ('acre');

-- ============================================================
-- PROFILES (base table for all users, linked to Supabase auth.users)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  mobile_number text not null unique,
  full_name text,
  is_registered boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_mobile on profiles(mobile_number);
create index idx_profiles_role on profiles(role);

-- ============================================================
-- FARMERS
-- ============================================================
create table farmers (
  id uuid primary key references profiles(id) on delete cascade,
  full_name text not null,
  mobile_number text not null,
  address text not null,
  district text not null,
  taluka text not null,
  village text not null,
  aadhar_front_url text,
  aadhar_back_url text,
  approval_status approval_status not null default 'pending',
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_farmers_village on farmers(village);
create index idx_farmers_district_taluka on farmers(district, taluka);
create index idx_farmers_name_trgm on farmers using gin (full_name gin_trgm_ops);
create index idx_farmers_mobile_trgm on farmers using gin (mobile_number gin_trgm_ops);

-- ============================================================
-- FARMS (सातबारा / 7/12) — Unlimited per farmer
-- ============================================================
create table farms (
  id uuid primary key default uuid_generate_v4(),
  farmer_id uuid not null references farmers(id) on delete cascade,
  village text not null,
  survey_number text not null,
  area_acre numeric(10,2) not null check (area_acre > 0),
  document_url text not null, -- PDF or image of 7/12
  document_type text not null default 'pdf', -- 'pdf' | 'image'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_farms_farmer on farms(farmer_id);
create index idx_farms_village on farms(village);

-- ============================================================
-- DRIVERS
-- ============================================================
create table drivers (
  id uuid primary key references profiles(id) on delete cascade,
  full_name text not null,
  mobile_number text not null,
  address text not null,
  village text not null,
  tractor_brand text not null,
  tractor_company text not null,
  rc_book_url text not null,
  driving_licence_url text not null,
  aadhar_front_url text not null,
  aadhar_back_url text not null,
  tractor_photo_url text not null,
  approval_status approval_status not null default 'pending',
  rejection_reason text,
  is_available boolean not null default true,
  rating numeric(3,2) not null default 5.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_drivers_village on drivers(village);
create index idx_drivers_name_trgm on drivers using gin (full_name gin_trgm_ops);
create index idx_drivers_mobile_trgm on drivers using gin (mobile_number gin_trgm_ops);

-- Nearby villages mapping (admin maintained, used for booking assignment)
create table village_neighbors (
  id uuid primary key default uuid_generate_v4(),
  village text not null,
  neighbor_village text not null,
  district text not null,
  taluka text not null,
  unique(village, neighbor_village)
);
create index idx_village_neighbors_village on village_neighbors(village);

-- ============================================================
-- SERVICES (Master list — admin editable, NOT hardcoded in UI)
-- ============================================================
create table services (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique, -- e.g. 'काश्या काढणे व जमा करणे'
  price_per_acre numeric(10,2) not null,
  unit service_unit not null default 'acre',
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed the 7 services from spec
insert into services (name, price_per_acre, display_order) values
  ('काश्या काढणे व जमा करणे', 820, 1),
  ('पंजी मारणे', 820, 2),
  ('फास मारणे', 820, 3),
  ('नांगरणी', 1620, 4),
  ('Cultivator', 820, 5),
  ('Rotavator', 1420, 6),
  ('Bed मारणे', 1220, 7);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table subscription_plans (
  id uuid primary key default uuid_generate_v4(),
  price_per_acre_per_year numeric(10,2) not null default 550,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into subscription_plans (price_per_acre_per_year) values (550);

create table farmer_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  farmer_id uuid not null references farmers(id) on delete cascade,
  plan_id uuid not null references subscription_plans(id),
  -- farms covered by this subscription (all or specific)
  covers_all_farms boolean not null default true,
  total_acre numeric(10,2) not null,
  amount numeric(10,2) not null,
  start_date date not null default current_date,
  end_date date not null,
  payment_id uuid, -- fk added after payments table
  is_active boolean not null default false, -- becomes true after payment success
  created_at timestamptz not null default now()
);
create index idx_farmer_subscriptions_farmer on farmer_subscriptions(farmer_id);

create table farmer_subscription_farms (
  subscription_id uuid not null references farmer_subscriptions(id) on delete cascade,
  farm_id uuid not null references farms(id) on delete cascade,
  primary key (subscription_id, farm_id)
);

-- ============================================================
-- BOOKINGS (one booking can have multiple farms x services)
-- ============================================================
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  booking_number text not null unique, -- human readable e.g. KJ-2026-00001
  farmer_id uuid not null references farmers(id) on delete cascade,
  booking_date date not null,
  notes text,
  total_amount numeric(10,2) not null,
  discount_applied numeric(10,2) not null default 0, -- 50% subscriber discount
  final_amount numeric(10,2) not null,
  status booking_status not null default 'pending',
  payment_status payment_status not null default 'pending',
  assigned_driver_id uuid references drivers(id),
  completion_otp text, -- generated at job-start, verified at completion
  completion_otp_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_bookings_farmer on bookings(farmer_id);
create index idx_bookings_driver on bookings(assigned_driver_id);
create index idx_bookings_status on bookings(status);
create index idx_bookings_date on bookings(booking_date);

-- Each line item: one farm + one service within a booking
create table booking_items (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  farm_id uuid not null references farms(id),
  service_id uuid not null references services(id),
  area_acre numeric(10,2) not null,
  rate_per_acre numeric(10,2) not null,
  amount numeric(10,2) not null,
  discount_percent numeric(5,2) not null default 0,
  final_amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index idx_booking_items_booking on booking_items(booking_id);

-- Which villages a booking is broadcast to (nearby-village targeting log)
create table booking_notifications_log (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  driver_id uuid not null references drivers(id) on delete cascade,
  notified_at timestamptz not null default now(),
  responded boolean not null default false,
  unique (booking_id, driver_id)
);

-- Booking status history (audit trail)
create table booking_status_history (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  status booking_status not null,
  changed_by uuid references profiles(id),
  reason text, -- e.g. rejection reason
  latitude numeric(10,6),
  longitude numeric(10,6),
  created_at timestamptz not null default now()
);
create index idx_booking_status_history_booking on booking_status_history(booking_id);

-- Job completion photos (mandatory)
create table booking_completion_photos (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  photo_url text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
create table payments (
  id uuid primary key default uuid_generate_v4(),
  farmer_id uuid not null references farmers(id),
  booking_id uuid references bookings(id),
  subscription_id uuid references farmer_subscriptions(id),
  amount numeric(10,2) not null,
  method payment_method not null,
  status payment_status not null default 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  invoice_number text unique,
  invoice_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_payments_farmer on payments(farmer_id);
create index idx_payments_booking on payments(booking_id);

alter table farmer_subscriptions
  add constraint fk_sub_payment foreign key (payment_id) references payments(id);

-- ============================================================
-- CHAT (Farmer <-> Driver, per booking)
-- ============================================================
create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  message text,
  image_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_chat_booking on chat_messages(booking_id, created_at);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  target_type notification_target not null,
  target_village text, -- when target_type = 'village'
  recipient_id uuid references profiles(id), -- when specific user
  title text not null,
  body text not null,
  data jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_recipient on notifications(recipient_id, is_read);

-- ============================================================
-- LEADERBOARD (materialized via query, but store snapshots for history)
-- ============================================================
create table driver_leaderboard_snapshots (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references drivers(id) on delete cascade,
  period_type text not null, -- 'monthly' | 'yearly'
  period_key text not null, -- '2026-07' or '2026'
  village text not null,
  jobs_completed int not null default 0,
  total_earnings numeric(10,2) not null default 0,
  rank int,
  incentive_amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(driver_id, period_type, period_key)
);
create index idx_leaderboard_period on driver_leaderboard_snapshots(period_type, period_key);

-- ============================================================
-- AUDIT LOG
-- ============================================================
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on profiles for each row execute function set_updated_at();
create trigger trg_farmers_updated before update on farmers for each row execute function set_updated_at();
create trigger trg_farms_updated before update on farms for each row execute function set_updated_at();
create trigger trg_drivers_updated before update on drivers for each row execute function set_updated_at();
create trigger trg_services_updated before update on services for each row execute function set_updated_at();
create trigger trg_bookings_updated before update on bookings for each row execute function set_updated_at();
create trigger trg_payments_updated before update on payments for each row execute function set_updated_at();

-- ============================================================
-- FUNCTION: booking_number generator
-- ============================================================
create sequence booking_number_seq start 1;
create or replace function generate_booking_number()
returns trigger as $$
begin
  new.booking_number := 'KJ-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('booking_number_seq')::text, 5, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_booking_number before insert on bookings
  for each row when (new.booking_number is null)
  execute function generate_booking_number();

-- ============================================================
-- FUNCTION: log booking status change into history
-- ============================================================
create or replace function log_booking_status_change()
returns trigger as $$
begin
  if (tg_op = 'INSERT') or (old.status is distinct from new.status) then
    insert into booking_status_history (booking_id, status, changed_by)
    values (new.id, new.status, new.assigned_driver_id);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_booking_status_log after insert or update on bookings
  for each row execute function log_booking_status_change();

-- ============================================================
-- END OF SCHEMA
-- ============================================================
