import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { ContentType, ItemStatus } from '@/types/models';

export interface LibraryItem {
  id: string;
  status: ItemStatus;
  progress_current: number | null;
  progress_total: number | null;
  last_activity_at: string | null;
  /** Minutes logged against this item. Defaults to 0 server-side, never null. */
  time_spent_minutes: number;
  started_at: string | null;
  content: {
    id: string;
    title: string;
    cover_url: string | null;
    type: ContentType;
    /** Heterogeneous, type-specific fields: genres, platform, runtime, pages... */
    metadata: Record<string, unknown> | null;
  } | null;
}

/** The current user's tracked items, newest activity first. */
export function useLibrary(userId: string | undefined) {
  return useQuery({
    queryKey: ['library', userId],
    enabled: !!userId,
    queryFn: async (): Promise<LibraryItem[]> => {
      const { data, error } = await supabase
        .from('user_items')
        .select(
          'id, status, progress_current, progress_total, last_activity_at, ' +
            'time_spent_minutes, started_at, ' +
            'content:content_items (id, title, cover_url, type, metadata)',
        )
        .order('last_activity_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return (data ?? []) as unknown as LibraryItem[];
    },
  });
}
