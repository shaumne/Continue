import { useMemo } from 'react';

import { ContentTypeColors } from '@/constants/theme';
import type { ContentType } from '@/types/models';

import { useLibrary } from './use-library';

export interface TypeCount {
  type: ContentType;
  count: number;
  color: string;
}

export interface StatsSummary {
  total: number;
  byType: TypeCount[];
  completed: number;
  inProgress: number;
  backlog: number;
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
    let completed = 0;
    let inProgress = 0;
    let backlog = 0;

    for (const item of items) {
      const type = item.content?.type;
      if (type) counts.set(type, (counts.get(type) ?? 0) + 1);

      if (item.status === 'completed') completed += 1;
      else if (IN_PROGRESS_STATUSES.has(item.status)) inProgress += 1;
      else if (item.status === 'backlog') backlog += 1;
    }

    const byType: TypeCount[] = [...counts.entries()]
      .map(([type, count]) => ({ type, count, color: ContentTypeColors[type] }))
      .sort((a, b) => b.count - a.count);

    return { total: items.length, byType, completed, inProgress, backlog };
  }, [items]);

  return { ...summary, isLoading };
}
