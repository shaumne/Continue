-- Continue — Migration 1/3: enums + global catalog.
-- Reversible via the rollback block at the end. Greenfield: no data-loss risk.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type content_type as enum (
  'game', 'movie', 'tv', 'book', 'anime', 'podcast', 'youtube', 'course'
);

create type external_source as enum (
  'tmdb', 'anilist', 'igdb', 'steam', 'google_books'
);

create type item_status as enum (
  'backlog', 'started', 'paused', 'completed', 'dropped'
);

create type quest_scope as enum ('daily', 'weekly', 'challenge');

create type activity_event as enum ('start', 'progress', 'complete', 'rate');

-- ---------------------------------------------------------------------------
-- content_items — global, shared catalog. Deduped by (external_source, external_id).
-- Populated by the `catalog` edge function (see api-integrator).
-- ---------------------------------------------------------------------------
create table content_items (
  id              uuid primary key default gen_random_uuid(),
  type            content_type not null,
  external_source external_source not null,
  external_id     text not null,
  title           text not null,
  cover_url       text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  unique (external_source, external_id)
);

create index content_items_type_idx on content_items (type);

-- ---------------------------------------------------------------------------
-- Rollback (manual):
--   drop table if exists content_items;
--   drop type if exists activity_event, quest_scope, item_status,
--                        external_source, content_type;
-- ---------------------------------------------------------------------------
