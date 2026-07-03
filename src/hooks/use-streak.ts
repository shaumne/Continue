import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useProfile } from '@/hooks/use-profile';
import { supabase } from '@/lib/supabase';

interface ActivityDayRow {
  created_at: string;
}

export interface StreakVM {
  currentStreak: number;
  longestStreak: number;
  /** Day-of-month numbers (1-31) that had >=1 `activity_log` row in the visible month. */
  activeDays: Set<number>;
  isLoading: boolean;
}

/**
 * Streak screen data: current/longest streak from `user_profile` (via the
 * existing `useProfile` hook), plus which days of the given month had
 * activity, for the calendar highlight. Mirrors the `useWrapped` pattern of
 * aggregating a raw `activity_log` range query client-side.
 *
 * `month` is 0-indexed (matches `Date#getMonth()`), driven by the screen so
 * navigating months re-queries the right range.
 */
export function useStreak(
  userId: string | undefined,
  year: number,
  month: number,
): StreakVM {
  const { data: profile, isLoading: profileLoading } = useProfile(userId);

  const monthStart = new Date(year, month, 1).toISOString();
  const nextMonthStart = new Date(year, month + 1, 1).toISOString();

  const activityQuery = useQuery({
    queryKey: ['streak-activity', userId, year, month],
    enabled: !!userId,
    queryFn: async (): Promise<ActivityDayRow[]> => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('created_at')
        .gte('created_at', monthStart)
        .lt('created_at', nextMonthStart);

      if (error) throw error;
      return data ?? [];
    },
  });

  const activeDays = useMemo(() => {
    const days = new Set<number>();
    for (const row of activityQuery.data ?? []) {
      days.add(new Date(row.created_at).getDate());
    }
    return days;
  }, [activityQuery.data]);

  return {
    currentStreak: profile?.current_streak ?? 0,
    longestStreak: profile?.longest_streak ?? 0,
    activeDays,
    isLoading: profileLoading || activityQuery.isLoading,
  };
}
