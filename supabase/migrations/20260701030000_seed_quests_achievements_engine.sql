-- Continue — Migration 5/5: quest + achievement definitions and progress engine.
--
-- Fully additive / expand-safe:
--   * ADD COLUMN IF NOT EXISTS (quests.code) + unique index for a stable natural key
--   * INSERT ... ON CONFLICT DO NOTHING seeds (idempotent)
--   * CREATE OR REPLACE FUNCTION for the engine
--   * DROP TRIGGER IF EXISTS + CREATE TRIGGER (idempotent re-attach)
-- No DROP of tables/columns, no type narrowing, no data loss.
--
-- Invariants preserved:
--   * Definition tables (quests, achievements) stay public-read / service-write.
--   * Per-user tables (user_quests, user_achievements) stay owner read-only for
--     clients; progress is advanced ONLY by the SECURITY DEFINER engine below,
--     which bypasses RLS. Clients cannot forge progress.
--   * All engine functions pin search_path (matches migrations 3 & 4).

-- ===========================================================================
-- 0) quests natural key. quests only had `id`; add a stable `code` so the seed
--    is idempotent and re-runnable. Nullable + unique index => existing rows
--    (none in greenfield) keep NULL without collision.
-- ===========================================================================
alter table quests add column if not exists code text;
create unique index if not exists quests_code_key on quests (code);

-- ===========================================================================
-- 1) Quest definitions (idempotent by code).
--    content_type NULL => quest applies to any content type.
-- ===========================================================================
insert into quests (code, scope, title, description, target, xp_reward, content_type, active) values
  ('daily_log_activity',  'daily',  'Log activity today',      'Log any tracked activity today.',              1,  20,  null, true),
  ('daily_make_progress', 'daily',  'Make progress on 1 item', 'Record progress on at least one item today.',  1,  30,  null, true),
  ('weekly_complete_1',   'weekly', 'Complete 1 item',         'Finish at least one item this week.',          1,  100, null, true),
  ('weekly_add_3',        'weekly', 'Add 3 items to library',  'Start tracking 3 new items this week.',        3,  150, null, true)
on conflict (code) do nothing;

-- ===========================================================================
-- 2) Achievement definitions (idempotent by the existing `key` unique column).
-- ===========================================================================
insert into achievements (key, title, description, target, icon) values
  ('first_steps', 'First Steps', 'Start tracking your first item.',  1,  'sprout'),
  ('finisher',    'Finisher',    'Complete your first item.',        1,  'flag-checkered'),
  ('marathon',    'Marathon',    'Complete 10 items.',               10, 'running'),
  ('dedicated',   'Dedicated',   'Reach a 7-day activity streak.',   7,  'fire')
on conflict (key) do nothing;

-- ===========================================================================
-- 3) Progress engine — SECURITY DEFINER helpers + a trigger on activity_log.
--    Helpers are revoked from clients: they are reachable only from the
--    definer-owned trigger function, so clients can never call them to self-
--    grant progress. (The trigger owner can execute its own functions
--    regardless of grants.)
-- ===========================================================================

-- Advance (increment) a per-user quest for the given period bucket, capping at
-- the quest target. Stamps completed_at once and awards xp_reward once.
create or replace function advance_quest(
  p_uid        uuid,
  p_code       text,
  p_period_key text,
  p_inc        int
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_quest     quests%rowtype;
  v_progress  int;
  v_completed timestamptz;
begin
  select * into v_quest from quests where code = p_code and active limit 1;
  if not found then
    return;
  end if;

  insert into user_quests (user_id, quest_id, progress, period_key)
  values (p_uid, v_quest.id, least(p_inc, v_quest.target), p_period_key)
  on conflict (user_id, quest_id, period_key) do update
    set progress = least(user_quests.progress + p_inc, v_quest.target)
  returning progress, completed_at into v_progress, v_completed;

  -- Complete-once: stamp completed_at and grant the quest XP a single time.
  if v_progress >= v_quest.target and v_completed is null then
    update user_quests
      set completed_at = now()
      where user_id = p_uid and quest_id = v_quest.id and period_key = p_period_key
        and completed_at is null;

    if v_quest.xp_reward > 0 then
      update user_profile
        set xp    = xp + v_quest.xp_reward,
            level = 1 + (xp + v_quest.xp_reward) / 1000
        where user_id = p_uid;
    end if;
  end if;
end;
$$;

-- Increment a count-based achievement (e.g. "complete 10 items").
create or replace function advance_achievement(
  p_uid uuid,
  p_key text,
  p_inc int
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ach      achievements%rowtype;
  v_progress int;
  v_unlocked timestamptz;
begin
  select * into v_ach from achievements where key = p_key limit 1;
  if not found then
    return;
  end if;

  insert into user_achievements (user_id, achievement_id, progress)
  values (p_uid, v_ach.id, least(p_inc, v_ach.target))
  on conflict (user_id, achievement_id) do update
    set progress = least(user_achievements.progress + p_inc, v_ach.target)
  returning progress, unlocked_at into v_progress, v_unlocked;

  if v_progress >= v_ach.target and v_unlocked is null then
    update user_achievements
      set unlocked_at = now()
      where user_id = p_uid and achievement_id = v_ach.id and unlocked_at is null;
  end if;
end;
$$;

-- Set a "high-water-mark" achievement (e.g. "reach a 7-day streak"): progress
-- moves to the max value seen, never decreases.
create or replace function set_achievement_high_water(
  p_uid   uuid,
  p_key   text,
  p_value int
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ach      achievements%rowtype;
  v_progress int;
  v_unlocked timestamptz;
begin
  select * into v_ach from achievements where key = p_key limit 1;
  if not found then
    return;
  end if;

  insert into user_achievements (user_id, achievement_id, progress)
  values (p_uid, v_ach.id, least(greatest(p_value, 0), v_ach.target))
  on conflict (user_id, achievement_id) do update
    set progress = least(greatest(user_achievements.progress, p_value), v_ach.target)
  returning progress, unlocked_at into v_progress, v_unlocked;

  if v_progress >= v_ach.target and v_unlocked is null then
    update user_achievements
      set unlocked_at = now()
      where user_id = p_uid and achievement_id = v_ach.id and unlocked_at is null;
  end if;
end;
$$;

-- Trigger body: fan the just-inserted activity out to quests + achievements.
create or replace function advance_gamification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid        uuid := new.user_id;
  v_event      activity_event := new.event;
  v_today      date := current_date;
  v_daily_key  text := to_char(v_today, 'YYYY-MM-DD');   -- e.g. 2026-07-01
  v_weekly_key text := to_char(v_today, 'IYYY-"W"IW');   -- ISO week, e.g. 2026-W27
  v_streak     int;
begin
  -- ---- Quests -------------------------------------------------------------
  -- Any activity counts toward the "log something today" daily.
  perform advance_quest(v_uid, 'daily_log_activity', v_daily_key, 1);

  if v_event = 'progress' then
    perform advance_quest(v_uid, 'daily_make_progress', v_daily_key, 1);
  end if;

  if v_event = 'complete' then
    perform advance_quest(v_uid, 'weekly_complete_1', v_weekly_key, 1);
  end if;

  -- No dedicated "added to library" event exists; 'start' (began tracking an
  -- item) is the closest proxy for adding an item to the library.
  if v_event = 'start' then
    perform advance_quest(v_uid, 'weekly_add_3', v_weekly_key, 1);
  end if;

  -- ---- Achievements -------------------------------------------------------
  if v_event = 'start' then
    perform advance_achievement(v_uid, 'first_steps', 1);
  end if;

  if v_event = 'complete' then
    perform advance_achievement(v_uid, 'finisher', 1);
    perform advance_achievement(v_uid, 'marathon', 1);
  end if;

  -- Streak achievement is high-water-mark based. Reads current_streak AFTER
  -- apply_activity() has updated it (see trigger ordering note below).
  select current_streak into v_streak from user_profile where user_id = v_uid;
  perform set_achievement_high_water(v_uid, 'dedicated', coalesce(v_streak, 0));

  return new;
end;
$$;

-- Lock the engine to server code only: clients must not call these directly.
revoke all on function advance_quest(uuid, text, text, int)          from public;
revoke all on function advance_achievement(uuid, text, int)          from public;
revoke all on function set_achievement_high_water(uuid, text, int)   from public;
revoke all on function advance_gamification()                        from public;

-- ---------------------------------------------------------------------------
-- Trigger ordering: Postgres fires per-event triggers in alphabetical order by
-- trigger name. The streak-based 'dedicated' achievement must read the streak
-- AFTER apply_activity() has updated it, so this trigger name
-- ('on_activity_quests_achievements') is deliberately chosen to sort AFTER the
-- existing 'on_activity_logged' trigger. Do not rename below 'on_activity_l...'.
-- ---------------------------------------------------------------------------
drop trigger if exists on_activity_quests_achievements on activity_log;
create trigger on_activity_quests_achievements
  after insert on activity_log
  for each row execute function advance_gamification();

-- ---------------------------------------------------------------------------
-- Rollback (manual):
--   drop trigger if exists on_activity_quests_achievements on activity_log;
--   drop function if exists advance_gamification();
--   drop function if exists set_achievement_high_water(uuid, text, int);
--   drop function if exists advance_achievement(uuid, text, int);
--   drop function if exists advance_quest(uuid, text, text, int);
--   delete from achievements where key in
--     ('first_steps','finisher','marathon','dedicated');
--   delete from quests where code in
--     ('daily_log_activity','daily_make_progress','weekly_complete_1','weekly_add_3');
--   drop index if exists quests_code_key;
--   alter table quests drop column if exists code;   -- destructive: drops the seed key
-- ---------------------------------------------------------------------------
