-- ============================================================
-- किसान जुताई — Phase 3: Leaderboard Auto-Calculation
-- Run this in Supabase SQL Editor AFTER schema.sql + rls_policies.sql + phase2_functions.sql
-- ============================================================

-- Recalculates jobs_completed, total_earnings and rank for every driver
-- in a given village for a given period ('monthly' -> '2026-07', 'yearly' -> '2026'),
-- and assigns incentive amounts to the top 3 ranked drivers.
create or replace function refresh_driver_leaderboard(p_period_type text, p_period_key text, p_village text)
returns void as $$
begin
  -- Upsert stats for every driver in this village who completed at least one job in the period
  insert into driver_leaderboard_snapshots (driver_id, period_type, period_key, village, jobs_completed, total_earnings)
  select
    d.id,
    p_period_type,
    p_period_key,
    p_village,
    count(b.id),
    coalesce(sum(b.final_amount), 0)
  from drivers d
  join bookings b on b.assigned_driver_id = d.id and b.status = 'completed'
  where d.village = p_village
    and (
      (p_period_type = 'monthly' and to_char(b.updated_at, 'YYYY-MM') = p_period_key)
      or
      (p_period_type = 'yearly' and to_char(b.updated_at, 'YYYY') = p_period_key)
    )
  group by d.id
  on conflict (driver_id, period_type, period_key) do update
    set jobs_completed = excluded.jobs_completed,
        total_earnings = excluded.total_earnings;

  -- Recompute ranks within this village + period, best jobs_completed first
  with ranked as (
    select id, row_number() over (order by jobs_completed desc, total_earnings desc) as new_rank
    from driver_leaderboard_snapshots
    where period_type = p_period_type and period_key = p_period_key and village = p_village
  )
  update driver_leaderboard_snapshots dls
  set rank = ranked.new_rank,
      incentive_amount = case
        when ranked.new_rank = 1 then 1000
        when ranked.new_rank = 2 then 500
        when ranked.new_rank = 3 then 250
        else 0
      end
  from ranked
  where dls.id = ranked.id;
end;
$$ language plpgsql security definer;

revoke execute on function refresh_driver_leaderboard(text, text, text) from public, anon, authenticated;

-- Trigger: whenever a booking flips to 'completed', refresh both the monthly
-- and yearly leaderboard for the assigned driver's village.
create or replace function trigger_refresh_leaderboard()
returns trigger as $$
declare
  v_village text;
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') and new.assigned_driver_id is not null then
    select village into v_village from drivers where id = new.assigned_driver_id;
    if v_village is not null then
      perform refresh_driver_leaderboard('monthly', to_char(now(), 'YYYY-MM'), v_village);
      perform refresh_driver_leaderboard('yearly', to_char(now(), 'YYYY'), v_village);
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_refresh_leaderboard
  after update on bookings
  for each row execute function trigger_refresh_leaderboard();
