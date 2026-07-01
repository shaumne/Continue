import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/** An `achievements` row merged with the current user's `user_achievements` progress. */
export interface AchievementVM {
  id: string;
  key: string;
  title: string;
  description: string | null;
  target: number;
  icon: string | null;
  progress: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface AchievementsSummary {
  items: AchievementVM[];
  unlockedCount: number;
  total: number;
  isLoading: boolean;
}

/**
 * All seeded achievements, merged in JS with the current user's progress rows.
 * Achievements the user has no `user_achievements` row for yet default to
 * progress 0 / locked. Sorted unlocked-first, then by progress ratio desc.
 */
export function useAchievements(userId: string | undefined): AchievementsSummary {
  const achievementsQuery = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('id, key, title, description, target, icon');
      if (error) throw error;
      return data ?? [];
    },
  });

  const userAchievementsQuery = useQuery({
    queryKey: ['user-achievements', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('achievement_id, progress, unlocked_at');
      if (error) throw error;
      return data ?? [];
    },
  });

  const items = useMemo<AchievementVM[]>(() => {
    const achievements = achievementsQuery.data ?? [];
    const progressByAchievementId = new Map(
      (userAchievementsQuery.data ?? []).map((row) => [row.achievement_id, row]),
    );

    const merged = achievements.map((achievement) => {
      const row = progressByAchievementId.get(achievement.id);
      return {
        id: achievement.id,
        key: achievement.key,
        title: achievement.title,
        description: achievement.description,
        target: achievement.target,
        icon: achievement.icon,
        progress: row?.progress ?? 0,
        unlocked: row?.unlocked_at != null,
        unlocked_at: row?.unlocked_at ?? null,
      };
    });

    return merged.sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      const ratioA = a.target > 0 ? a.progress / a.target : 0;
      const ratioB = b.target > 0 ? b.progress / b.target : 0;
      return ratioB - ratioA;
    });
  }, [achievementsQuery.data, userAchievementsQuery.data]);

  return {
    items,
    unlockedCount: items.filter((item) => item.unlocked).length,
    total: items.length,
    isLoading: achievementsQuery.isLoading || userAchievementsQuery.isLoading,
  };
}
