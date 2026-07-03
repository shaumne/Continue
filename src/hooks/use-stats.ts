import { useMemo } from 'react';

import { ContentTypeColors } from '@/constants/theme';
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
}

const IN_PROGRESS_STATUSES = new Set(['started', 'paused']);

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
    };
  }, [items]);

  return { ...summary, isLoading };
}
