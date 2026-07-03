import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { ContentTypeColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { ContentType } from '@/types/models';

interface ActivityRow {
  id: string;
  event: string;
  created_at: string;
  content: { type: ContentType } | null;
}

interface CompletedItemRow {
  id: string;
  completed_at: string | null;
  time_spent_minutes: number | null;
  content: {
    id: string;
    title: string;
    cover_url: string | null;
    type: ContentType;
  } | null;
}

export interface WrappedTypeCount {
  type: ContentType;
  count: number;
  color: string;
}

export interface WrappedTopItem {
  id: string;
  title: string;
  cover_url: string | null;
  type: ContentType;
}

export interface WrappedVM {
  year: number;
  /** Completed `user_items` (status = 'completed', completed_at in the year). */
  completedCount: number;
  /** Total `activity_log` rows in the year — every start/progress/complete/rate event. */
  totalActivities: number;
  /**
   * Sum of `time_spent_minutes` across items completed in the year, in
   * MINUTES (despite the name, matching Spotify-Wrapped-style copy). Format
   * with `formatDuration` in the screen, don't divide here.
   */
  hoursSpent: number;
  byType: WrappedTypeCount[];
  /** Up to 5 completed items, most recent `completed_at` first. */
  topItems: WrappedTopItem[];
  /** 0-11 month index with the most `activity_log` rows, or null if empty. */
  busiestMonth: number | null;
}

function emptyWrapped(year: number): WrappedVM {
  return {
    year,
    completedCount: 0,
    totalActivities: 0,
    hoursSpent: 0,
    byType: [],
    topItems: [],
    busiestMonth: null,
  };
}

/**
 * Client-side aggregation of a calendar year's `activity_log` +
 * `user_items` (completed) into the Wrapped screen shape. Two independent
 * queries (activity feed, completed items) merged in JS — mirrors the
 * `useStats` pattern of deriving a summary from raw rows via `useMemo`.
 */
export function useWrapped(
  userId: string | undefined,
  year: number,
): { data: WrappedVM; isLoading: boolean } {
  const rangeStart = `${year}-01-01`;
  const rangeEnd = `${year + 1}-01-01`;

  const activityQuery = useQuery({
    queryKey: ['wrapped-activity', userId, year],
    enabled: !!userId,
    queryFn: async (): Promise<ActivityRow[]> => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('id, event, created_at, content:content_items (type)')
        .gte('created_at', rangeStart)
        .lt('created_at', rangeEnd);

      if (error) throw error;
      return (data ?? []) as unknown as ActivityRow[];
    },
  });

  const completedQuery = useQuery({
    queryKey: ['wrapped-completed', userId, year],
    enabled: !!userId,
    queryFn: async (): Promise<CompletedItemRow[]> => {
      const { data, error } = await supabase
        .from('user_items')
        .select(
          'id, completed_at, time_spent_minutes, ' +
            'content:content_items (id, title, cover_url, type)',
        )
        .eq('status', 'completed')
        .gte('completed_at', rangeStart)
        .lt('completed_at', rangeEnd)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as CompletedItemRow[];
    },
  });

  const data = useMemo<WrappedVM>(() => {
    const activity = activityQuery.data ?? [];
    const completed = completedQuery.data ?? [];

    if (!activity.length && !completed.length) return emptyWrapped(year);

    const typeCounts = new Map<ContentType, number>();
    const topItems: WrappedTopItem[] = [];
    let hoursSpent = 0;

    for (const item of completed) {
      const type = item.content?.type;
      if (type) typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
      hoursSpent += item.time_spent_minutes ?? 0;
      if (item.content && topItems.length < 5) {
        topItems.push({
          id: item.content.id,
          title: item.content.title,
          cover_url: item.content.cover_url,
          type: item.content.type,
        });
      }
    }

    const byType: WrappedTypeCount[] = [...typeCounts.entries()]
      .map(([type, count]) => ({ type, count, color: ContentTypeColors[type] }))
      .sort((a, b) => b.count - a.count);

    const monthCounts = new Array<number>(12).fill(0);
    for (const row of activity) {
      const month = new Date(row.created_at).getMonth();
      monthCounts[month] += 1;
    }
    const maxCount = Math.max(0, ...monthCounts);
    const busiestMonth = maxCount > 0 ? monthCounts.indexOf(maxCount) : null;

    return {
      year,
      completedCount: completed.length,
      totalActivities: activity.length,
      hoursSpent,
      byType,
      topItems,
      busiestMonth,
    };
  }, [activityQuery.data, completedQuery.data, year]);

  return { data, isLoading: activityQuery.isLoading || completedQuery.isLoading };
}
