import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import type { ItemStatus } from '@/types/models';

type UserItemUpdate = Database['public']['Tables']['user_items']['Update'];

type ActivityEvent = 'start' | 'progress' | 'complete' | 'rate';

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

export interface SaveProgressInput {
  userItemId: string;
  contentItemId: string;
  status: ItemStatus;
  progressCurrent: number | null;
  progressTotal: number | null;
}

/**
 * Persist a status/progress change, then log the matching activity so XP and
 * streak advance server-side (via the log_activity RPC — the client never sets
 * the XP amount itself).
 */
export async function saveProgress(
  input: SaveProgressInput,
): Promise<{ error: string | null }> {
  const now = new Date().toISOString();
  const patch: UserItemUpdate = {
    status: input.status,
    progress_current: input.progressCurrent,
    progress_total: input.progressTotal,
    last_activity_at: now,
    ...(input.status === 'started' ? { started_at: now } : {}),
    ...(input.status === 'completed' ? { completed_at: now } : {}),
  };

  const { error: updateError } = await supabase
    .from('user_items')
    .update(patch)
    .eq('id', input.userItemId);
  if (updateError) return { error: updateError.message };

  const event: ActivityEvent =
    input.status === 'completed'
      ? 'complete'
      : input.status === 'started'
        ? 'start'
        : 'progress';

  const { error: rpcError } = await supabase.rpc('log_activity', {
    p_content_item_id: input.contentItemId,
    p_event: event,
  });
  return { error: rpcError?.message ?? null };
}
