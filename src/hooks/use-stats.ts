import { useMemo } from 'react';

import { Brand, ContentTypeColors } from '@/constants/theme';
import type { ContentType } from '@/types/models';

import { useLibrary } from './use-library';

export interface TypeCount {
  type: ContentType;
  count: number;
  color: string;
}

/** Completed-item counts for the four content types shown as colored tiles. */
export interface CompletedTypeCounts {
  game: number;
  movie: number;
  book: number;
  anime: number;
}

export interface StatsSummary {
  total: number;
  byType: TypeCount[];
  completed: number;
  inProgress: number;
  backlog: number;
  completedByType: CompletedTypeCounts;
  /**
   * Anime "episodes" tile value. `useLibrary` only exposes each item's
   * *current* progress position (not a lifetime watched-episode counter),
   * so this sums `progress_current` across anime items as an approximation.
   * Falls back to a plain anime item count when no item has progress data.
   */
  animeEpisodes: number;
  animeEpisodesIsApproximate: boolean;
  /** Sum of `time_spent_minutes` across every tracked item. */
  totalMinutes: number;
  /** `totalMinutes` spread over the days since the user's first `started_at`. */
  avgMinutesPerDay: number;
  /**
   * Top genres aggregated from `content.metadata.genres` /
   * `content.metadata.categories` (string arrays only — TMDB's numeric
   * `genre_ids` are skipped since they can't be named client-side). Empty
   * when no item exposes string genres, so the screen can fall back to the
   * by-type donut.
   */
  genres: GenreCount[];
}

export interface GenreCount {
  name: string;
  count: number;
  color: string;
}

const IN_PROGRESS_STATUSES = new Set(['started', 'paused']);

/** Fixed, distinct colors for genre donut segments — cycled if there are more buckets than colors. */
const GENRE_PALETTE = [
  Brand.primary,
  ContentTypeColors.movie,
  Brand.xp,
  ContentTypeColors.book,
  ContentTypeColors.anime,
  Brand.streak,
];

/** Extracts genre/category name strings from a content item's provider metadata, if present. */
function extractGenreNames(metadata: Record<string, unknown> | null | undefined): string[] {
  if (!metadata) return [];
  const raw = metadata.genres ?? metadata.categories;
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry): entry is string => typeof entry === 'string');
}

/**
 * Whole days elapsed since `earliestStartedAtMs` (min 1, so average-per-day
 * never divides by zero). No `started_at` anywhere just means "today".
 * Kept as its own top-level helper (rather than inlined in the memo) so the
 * `Date.now()` read isn't flagged as an impure call inside render.
 */
function daysSinceStart(earliestStartedAtMs: number | null): number {
  if (earliestStartedAtMs === null) return 1;
  return Math.max(1, Math.ceil((Date.now() - earliestStartedAtMs) / (1000 * 60 * 60 * 24)));
}

/**
 * Client-side aggregation of the current user's library into stats-screen
 * shape. Derived entirely from `useLibrary` — no separate network call.
 */
export function useStats(userId: string | undefined): StatsSummary & { isLoading: boolean } {
  const { data: items = [], isLoading } = useLibrary(userId);

  const summary = useMemo<StatsSummary>(() => {
    const counts = new Map<ContentType, number>();
    const completedCounts = new Map<ContentType, number>();
    let completed = 0;
    let inProgress = 0;
    let backlog = 0;
    let animeEpisodeSum = 0;
    let animeHasProgress = false;
    let animeItemCount = 0;
    let totalMinutes = 0;
    let earliestStartedAtMs: number | null = null;
    const genreCounts = new Map<string, number>();

    for (const item of items) {
      const type = item.content?.type;
      if (type) counts.set(type, (counts.get(type) ?? 0) + 1);

      if (item.status === 'completed') {
        completed += 1;
        if (type) completedCounts.set(type, (completedCounts.get(type) ?? 0) + 1);
      } else if (IN_PROGRESS_STATUSES.has(item.status)) inProgress += 1;
      else if (item.status === 'backlog') backlog += 1;

      if (type === 'anime') {
        animeItemCount += 1;
        if (item.progress_current != null) {
          animeHasProgress = true;
          animeEpisodeSum += item.progress_current;
        }
      }

      totalMinutes += item.time_spent_minutes ?? 0;

      if (item.started_at) {
        const startedMs = new Date(item.started_at).getTime();
        if (!Number.isNaN(startedMs) && (earliestStartedAtMs === null || startedMs < earliestStartedAtMs)) {
          earliestStartedAtMs = startedMs;
        }
      }

      for (const name of extractGenreNames(item.content?.metadata)) {
        genreCounts.set(name, (genreCounts.get(name) ?? 0) + 1);
      }
    }

    const avgMinutesPerDay = totalMinutes / daysSinceStart(earliestStartedAtMs);

    const sortedGenres = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]);
    let genres: GenreCount[] = [];
    if (sortedGenres.length > 0) {
      const topGenres = sortedGenres.slice(0, 5);
      const restGenres = sortedGenres.slice(5);
      genres = topGenres.map(([name, count], index) => ({
        name,
        count,
        color: GENRE_PALETTE[index % GENRE_PALETTE.length],
      }));
      if (restGenres.length > 0) {
        genres.push({
          name: 'Others',
          count: restGenres.reduce((sum, [, count]) => sum + count, 0),
          color: GENRE_PALETTE[topGenres.length % GENRE_PALETTE.length],
        });
      }
    }

    const byType: TypeCount[] = [...counts.entries()]
      .map(([type, count]) => ({ type, count, color: ContentTypeColors[type] }))
      .sort((a, b) => b.count - a.count);

    const completedByType: CompletedTypeCounts = {
      game: completedCounts.get('game') ?? 0,
      movie: completedCounts.get('movie') ?? 0,
      book: completedCounts.get('book') ?? 0,
      anime: completedCounts.get('anime') ?? 0,
    };

    return {
      total: items.length,
      byType,
      completed,
      inProgress,
      backlog,
      completedByType,
      animeEpisodes: animeHasProgress ? animeEpisodeSum : animeItemCount,
      animeEpisodesIsApproximate: animeHasProgress,
      totalMinutes,
      avgMinutesPerDay,
      genres,
    };
  }, [items]);

  return { ...summary, isLoading };
}
