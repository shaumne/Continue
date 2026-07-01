import type { ContentType } from '@/constants/theme';

export type { ContentType } from '@/constants/theme';

/** External metadata providers. Matches content_items.external_source in Postgres. */
export type ExternalSource =
  | 'tmdb'
  | 'anilist'
  | 'igdb'
  | 'steam'
  | 'google_books';

/** User progress state for a tracked item. */
export type ItemStatus =
  | 'backlog'
  | 'started'
  | 'paused'
  | 'completed'
  | 'dropped';

/**
 * Global catalog entry (shared across users). Deduped by
 * (external_source, external_id). Populated by the `catalog` edge function.
 */
export interface ContentItem {
  id: string;
  type: ContentType;
  external_source: ExternalSource;
  external_id: string;
  title: string;
  cover_url: string | null;
  /** Heterogeneous, type-specific fields: genres, platform, runtime, pages... */
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Per-user tracking row over a ContentItem. */
export interface UserItem {
  id: string;
  user_id: string;
  content_item_id: string;
  status: ItemStatus;
  progress_current: number | null;
  progress_total: number | null;
  /** Type-specific sub-progress, e.g. game: {main,side,trophies}; tv: {season,episode}. */
  progress_detail: Record<string, unknown>;
  rating: number | null;
  notes: string | null;
  platform: string | null;
  time_spent_minutes: number;
  started_at: string | null;
  completed_at: string | null;
  last_activity_at: string | null;
}

/** Gamification profile — XP/level/streak. Mutated server-side only. */
export interface UserProfile {
  user_id: string;
  level: number;
  xp: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  daily_time_budget_minutes: number | null;
}
