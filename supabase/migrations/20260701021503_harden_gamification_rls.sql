-- Continue — Migration 4/4: harden gamification against client-side forgery.
--
-- Migrations 2 & 3 let an authenticated client write its own gamification rows
-- directly (user_profile.xp/level/streak, activity_log.delta, quest/achievement
-- progress). Because apply_activity() trusts activity_log.delta, a client could
-- self-grant unlimited XP. Lock every XP/progress path behind server code.

-- ===========================================================================
-- 1) user_profile: client may edit ONLY daily_time_budget_minutes.
--    xp / level / streak columns are server-managed (apply_activity).
--    RLS restricts the ROW to its owner; column privileges restrict the COLUMNS.
-- ===========================================================================
revoke update on user_profile from authenticated;
grant update (daily_time_budget_minutes) on user_profile to authenticated;

-- Profiles are created by handle_new_user(); clients never insert them (and must
-- not be able to seed one with inflated xp). Remove the client insert path.
drop policy if exists "user_profile insert" on user_profile;

-- ===========================================================================
-- 2) activity_log: remove the direct client insert. XP delta must be computed
--    server-side, so clients go through log_activity() instead.
-- ===========================================================================
drop policy if exists "activity_log insert" on activity_log;

-- Server-owned entry point: derives the XP delta from the event type; the
-- client cannot choose how much XP an event is worth. auth.uid() is the actor,
-- so a caller can only log activity for themselves.
create or replace function log_activity(
  p_content_item_id uuid,
  p_event activity_event
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_delta int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Server-defined XP table. Tune later; clients have no say.
  v_delta := case p_event
    when 'start'    then 5
    when 'progress' then 10
    when 'complete' then 50
    when 'rate'     then 5
    else 0
  end;

  insert into activity_log (user_id, content_item_id, event, delta)
  values (v_uid, p_content_item_id, p_event, v_delta);
end;
$$;

revoke all on function log_activity(uuid, activity_event) from public;
grant execute on function log_activity(uuid, activity_event) to authenticated;

-- Defense in depth: even if a row reaches activity_log, never apply negative or
-- absurd XP. apply_activity() already clamps with greatest(delta, 0); add an
-- upper bound here so a bad insert path can't mint XP.
alter table activity_log
  add constraint activity_log_delta_bounds check (delta >= 0 and delta <= 1000);

-- ===========================================================================
-- 3) user_quests / user_achievements: read-only for clients. Progress and
--    unlock timestamps are advanced by server logic (future RPC/trigger, which
--    runs as definer and bypasses RLS). Keep only the owner SELECT policies.
-- ===========================================================================
drop policy if exists "user_quests insert" on user_quests;
drop policy if exists "user_quests update" on user_quests;
drop policy if exists "user_quests delete" on user_quests;

drop policy if exists "user_achievements insert" on user_achievements;
drop policy if exists "user_achievements update" on user_achievements;
drop policy if exists "user_achievements delete" on user_achievements;

-- ---------------------------------------------------------------------------
-- Rollback (manual): recreate the dropped policies from migration 2, drop the
-- delta bounds constraint and log_activity(), and
--   grant update on user_profile to authenticated;
-- ---------------------------------------------------------------------------
