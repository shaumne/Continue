-- Continue — Migration 3/3: server-side gamification logic.
-- XP / level / streak are mutated ONLY here (SECURITY DEFINER), never by the
-- client, so progress can't be forged. This is a first-pass model; the XP curve
-- and streak rules are expected to be tuned during development.

-- ---------------------------------------------------------------------------
-- New auth user -> guarantee a user_profile row exists.
-- ---------------------------------------------------------------------------
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into user_profile (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Activity -> apply XP + advance/refresh streak.
-- Fires on every activity_log insert. delta carries the XP for that event.
-- ---------------------------------------------------------------------------
create function apply_activity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  today       date := current_date;
  prev_date   date;
  new_streak  int;
begin
  -- Ensure a profile row (defensive; handle_new_user normally created it).
  insert into user_profile (user_id)
  values (new.user_id)
  on conflict (user_id) do nothing;

  select last_activity_date into prev_date
  from user_profile where user_id = new.user_id for update;

  -- Streak: same day = unchanged; yesterday = +1; older/null = reset to 1.
  if prev_date = today then
    new_streak := null; -- sentinel: keep current_streak as-is
  elsif prev_date = today - 1 then
    new_streak := -1;   -- sentinel: increment
  else
    new_streak := 1;    -- reset
  end if;

  update user_profile
  set
    xp = xp + greatest(new.delta, 0),
    -- Level curve: every 1000 XP = 1 level. Tune later.
    level = 1 + (xp + greatest(new.delta, 0)) / 1000,
    current_streak = case
      when new_streak is null then current_streak
      when new_streak = -1 then current_streak + 1
      else 1
    end,
    longest_streak = greatest(
      longest_streak,
      case
        when new_streak is null then current_streak
        when new_streak = -1 then current_streak + 1
        else 1
      end
    ),
    last_activity_date = today
  where user_id = new.user_id;

  return new;
end;
$$;

create trigger on_activity_logged
  after insert on activity_log
  for each row execute function apply_activity();

-- ---------------------------------------------------------------------------
-- Rollback (manual):
--   drop trigger if exists on_activity_logged on activity_log;
--   drop trigger if exists on_auth_user_created on auth.users;
--   drop function if exists apply_activity();
--   drop function if exists handle_new_user();
-- ---------------------------------------------------------------------------
