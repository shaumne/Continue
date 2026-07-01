import { supabase } from '@/lib/supabase';

/**
 * Add a catalog item to the current user's library (status: backlog).
 * Idempotent: (user_id, content_item_id) is unique, so re-adding is ignored.
 */
export async function addToLibrary(
  userId: string,
  contentItemId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_items')
    .upsert(
      { user_id: userId, content_item_id: contentItemId, status: 'backlog' },
      { onConflict: 'user_id,content_item_id', ignoreDuplicates: true },
    );
  return { error: error?.message ?? null };
}
