import { supabase } from '@/lib/supabase';

/**
 * Persist the user's daily time budget (minutes). RLS on `user_profile` only
 * permits the client to write this single column — level/XP/streak stay
 * server-only. Pass `null` to clear the budget.
 */
export async function saveDailyBudget(
  userId: string,
  minutes: number | null,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_profile')
    .update({ daily_time_budget_minutes: minutes })
    .eq('user_id', userId);
  return { error: error?.message ?? null };
}
