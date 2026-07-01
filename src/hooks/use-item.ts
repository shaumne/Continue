import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { ContentType, ItemStatus } from '@/types/models';

/** Full detail for a single tracked item (Detail screen), joined with its catalog entry. */
export interface ItemDetail {
  id: string;
  status: ItemStatus;
  progress_current: number | null;
  progress_total: number | null;
  last_activity_at: string | null;
  rating: number | null;
  notes: string | null;
  platform: string | null;
  time_spent_minutes: number;
  started_at: string | null;
  completed_at: string | null;
  progress_detail: Record<string, unknown>;
  content: {
    id: string;
    title: string;
    cover_url: string | null;
    type: ContentType;
    metadata: Record<string, unknown>;
  } | null;
}

/** A single `user_items` row (by its id) with full detail, for the Detail screen. */
export function useItem(userItemId: string | undefined) {
  return useQuery({
    queryKey: ['item', userItemId],
    enabled: !!userItemId,
    queryFn: async (): Promise<ItemDetail> => {
      const { data, error } = await supabase
        .from('user_items')
        .select(
          'id, status, progress_current, progress_total, last_activity_at, rating, notes, ' +
            'platform, time_spent_minutes, started_at, completed_at, progress_detail, ' +
            'content:content_items (id, title, cover_url, type, metadata)',
        )
        .eq('id', userItemId as string)
        .single();

      if (error) throw error;
      return data as unknown as ItemDetail;
    },
  });
}
