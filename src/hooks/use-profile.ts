import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types/models';

/** The current user's gamification profile (level, XP, streak). */
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async (): Promise<UserProfile | null> => {
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
