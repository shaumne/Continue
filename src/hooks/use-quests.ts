import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { ContentType } from '@/types/models';

export type QuestScope = 'daily' | 'weekly';

/** Row shape from `quests` (public, active-only). */
export interface QuestDef {
  id: string;
  code: string;
  scope: QuestScope;
  title: string;
  description: string | null;
  target: number;
  xp_reward: number;
  content_type: ContentType | null;
}

/** Quest definition merged with the current user's progress for this period. */
export interface QuestVM extends QuestDef {
  progress: number;
  completed: boolean;
}

interface UserQuestRow {
  quest_id: string;
  progress: number;
  period_key: string;
  completed_at: string | null;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Current period keys matching the server's Postgres format
 * (`to_char(now(), 'YYYY-MM-DD')` for daily, `to_char(now(), 'IYYY-"W"IW')`
 * for weekly). Must stay in sync with the SQL in
 * `supabase/migrations/20260701030000_seed_quests_achievements_engine.sql`.
 *
 * Daily is the local calendar date. Weekly is the ISO-8601 week (Thursday-based
 * week-numbering: the week containing the year's first Thursday is week 1).
 * The ISO calculation runs on a UTC pseudo-date built from local Y/M/D so it
 * isn't shifted by the runtime's timezone offset near local midnight.
 */
export function currentPeriodKeys(): { daily: string; weekly: string } {
  const now = new Date();
  const daily = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // Monday = 0 .. Sunday = 6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // nearest Thursday

  const isoYear = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 4));
  const yearStartDayNum = (yearStart.getUTCDay() + 6) % 7;
  yearStart.setUTCDate(yearStart.getUTCDate() - yearStartDayNum + 3);

  const isoWeek = 1 + Math.round((d.getTime() - yearStart.getTime()) / (7 * 86400000));
  const weekly = `${isoYear}-W${pad2(isoWeek)}`;

  return { daily, weekly };
}

/** Active quest definitions, public read (no user scoping). */
function useQuestDefs() {
  return useQuery({
    queryKey: ['quests'],
    queryFn: async (): Promise<QuestDef[]> => {
      const { data, error } = await supabase
        .from('quests')
        .select('id, code, scope, title, description, target, xp_reward, content_type')
        .eq('active', true);

      if (error) throw error;
      return (data ?? []) as unknown as QuestDef[];
    },
  });
}

/** The current user's progress rows for the active daily/weekly periods. */
function useUserQuestRows(userId: string | undefined, daily: string, weekly: string) {
  return useQuery({
    queryKey: ['user_quests', userId, daily, weekly],
    enabled: !!userId,
    queryFn: async (): Promise<UserQuestRow[]> => {
      const { data, error } = await supabase
        .from('user_quests')
        .select('quest_id, progress, period_key, completed_at')
        .in('period_key', [daily, weekly]);

      if (error) throw error;
      return (data ?? []) as unknown as UserQuestRow[];
    },
  });
}

/**
 * Active quests for the current daily/weekly periods, merged with the
 * signed-in user's progress (defaulting to progress 0 / not completed when
 * no `user_quests` row exists yet for this period).
 */
export function useQuests(userId: string | undefined): {
  daily: QuestVM[];
  weekly: QuestVM[];
  isLoading: boolean;
} {
  const { daily, weekly } = currentPeriodKeys();

  const { data: defs = [], isLoading: defsLoading } = useQuestDefs();
  const { data: userRows = [], isLoading: rowsLoading } = useUserQuestRows(userId, daily, weekly);

  return useMemo(() => {
    const merge = (def: QuestDef): QuestVM => {
      const periodKey = def.scope === 'daily' ? daily : weekly;
      const row = userRows.find((r) => r.quest_id === def.id && r.period_key === periodKey);
      return {
        ...def,
        progress: row?.progress ?? 0,
        completed: !!row?.completed_at,
      };
    };

    return {
      daily: defs.filter((d) => d.scope === 'daily').map(merge),
      weekly: defs.filter((d) => d.scope === 'weekly').map(merge),
      isLoading: defsLoading || rowsLoading,
    };
  }, [defs, userRows, daily, weekly, defsLoading, rowsLoading]);
}
