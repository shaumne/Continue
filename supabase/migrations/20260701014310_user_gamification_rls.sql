-- Continue — Migration 2/3: per-user tables, gamification, RLS.
-- Depends on migration 1 (enums, content_items). Greenfield: no data-loss risk.

-- ===========================================================================
-- Per-user tracking
-- ===========================================================================
create table user_items (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  content_item_id    uuid not null references content_items(id) on delete cascade,
  status             item_status not null default 'backlog',
  progress_current   numeric,
  progress_total     numeric,
  progress_detail    jsonb not null default '{}'::jsonb,
  rating             numeric check (rating >= 0 and rating <= 10),
  notes              text,
  platform           text,
  time_spent_minutes int not null default 0,
  started_at         timestamptz,
  completed_at       timestamptz,
  last_activity_at   timestamptz,
  unique (user_id, content_item_id)
);

create index user_items_user_activity_idx
  on user_items (user_id, last_activity_at desc);

-- ===========================================================================
-- Gamification profile
-- ===========================================================================
create table user_profile (
  user_id                   uuid primary key references auth.users(id) on delete cascade,
  level                     int not null default 1,
  xp                        int not null default 0,
  current_streak            int not null default 0,
  longest_streak            int not null default 0,
  last_activity_date        date,
  daily_time_budget_minutes int
);

-- Quest definitions (public) + per-user progress.
create table quests (
  id           uuid primary key default gen_random_uuid(),
  scope        quest_scope not null,
  title        text not null,
  description  text,
  target       int not null,
  xp_reward    int not null default 0,
  content_type content_type,
  active       boolean not null default true
);

create table user_quests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  quest_id     uuid not null references quests(id) on delete cascade,
  progress     int not null default 0,
  period_key   text not null, -- daily '2026-07-01' / weekly '2026-W27'
  completed_at timestamptz,
  unique (user_id, quest_id, period_key)
);

-- Achievement definitions (public) + per-user progress.
create table achievements (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  title       text not null,
  description text,
  target      int not null default 1,
  icon        text
);

create table user_achievements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  progress       int not null default 0,
  unlocked_at    timestamptz,
  unique (user_id, achievement_id)
);

-- Activity feed — source of truth for streak / stats / Wrapped.
create table activity_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  content_item_id uuid references content_items(id) on delete set null,
  event           activity_event not null,
  delta           int not null default 0,
  created_at      timestamptz not null default now()
);

create index activity_log_user_created_idx
  on activity_log (user_id, created_at desc);

-- ===========================================================================
-- Row Level Security
-- ===========================================================================

-- Public read-only tables (catalog + definitions). No write policy => only the
-- service role (which bypasses RLS) can write. RLS still enabled to deny anon writes.
alter table content_items enable row level security;
alter table quests        enable row level security;
alter table achievements  enable row level security;

create policy "content_items read"  on content_items for select to authenticated using (true);
create policy "quests read"         on quests        for select to authenticated using (true);
create policy "achievements read"   on achievements  for select to authenticated using (true);

-- Owner-only tables. Explicit policy per command.
alter table user_items        enable row level security;
alter table user_profile      enable row level security;
alter table user_quests       enable row level security;
alter table user_achievements enable row level security;
alter table activity_log      enable row level security;

-- user_items
create policy "user_items select" on user_items for select to authenticated using (auth.uid() = user_id);
create policy "user_items insert" on user_items for insert to authenticated with check (auth.uid() = user_id);
create policy "user_items update" on user_items for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_items delete" on user_items for delete to authenticated using (auth.uid() = user_id);

-- user_profile (note: XP/level/streak columns are mutated by a SECURITY DEFINER
-- trigger in migration 3, not by the client — but the row is owner-scoped.)
create policy "user_profile select" on user_profile for select to authenticated using (auth.uid() = user_id);
create policy "user_profile insert" on user_profile for insert to authenticated with check (auth.uid() = user_id);
create policy "user_profile update" on user_profile for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_profile delete" on user_profile for delete to authenticated using (auth.uid() = user_id);

-- user_quests
create policy "user_quests select" on user_quests for select to authenticated using (auth.uid() = user_id);
create policy "user_quests insert" on user_quests for insert to authenticated with check (auth.uid() = user_id);
create policy "user_quests update" on user_quests for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_quests delete" on user_quests for delete to authenticated using (auth.uid() = user_id);

-- user_achievements
create policy "user_achievements select" on user_achievements for select to authenticated using (auth.uid() = user_id);
create policy "user_achievements insert" on user_achievements for insert to authenticated with check (auth.uid() = user_id);
create policy "user_achievements update" on user_achievements for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_achievements delete" on user_achievements for delete to authenticated using (auth.uid() = user_id);

-- activity_log (insert + read own; no update/delete — it is an append-only feed).
create policy "activity_log select" on activity_log for select to authenticated using (auth.uid() = user_id);
create policy "activity_log insert" on activity_log for insert to authenticated with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Rollback (manual): drop tables in reverse dependency order:
--   activity_log, user_achievements, achievements, user_quests, quests,
--   user_profile, user_items.
-- ---------------------------------------------------------------------------
