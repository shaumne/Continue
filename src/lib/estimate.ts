import type { ContentType } from '@/types/models';

/**
 * MVP "how long is left" heuristics for an in-progress library item.
 *
 * These are rough per-type defaults (minutes per progress unit), not derived
 * from real metadata. Once the catalog edge function surfaces per-provider
 * runtime/page/episode metadata on `content_items.metadata` (TMDB runtime,
 * HowLongToBeat, Google Books page count, etc.), swap this for a
 * metadata-based estimate instead of guessing from progress counts alone.
 */

/** Rough minutes per progress unit by content type (unit varies: episode, page, hour...). */
const MINUTES_PER_UNIT: Record<ContentType, number> = {
  // Movies are tracked as one unit; when progress is present we treat
  // total/current as already being in minutes, so the multiplier is 1.
  movie: 1,
  tv: 25,
  anime: 25,
  book: 2,
  game: 60,
  course: 15,
  podcast: 30,
  youtube: 30,
};

/** Assumed full runtime for a movie that has no progress data yet. */
const DEFAULT_MOVIE_MINUTES = 120;

export interface EstimateItem {
  content: { type: ContentType } | null;
  progress_current: number | null;
  progress_total: number | null;
}

/**
 * Estimated remaining minutes for an in-progress item, or `null` when there's
 * no usable progress data to estimate from.
 */
export function estimateRemainingMinutes(item: EstimateItem): number | null {
  const type = item.content?.type;
  if (!type) return null;

  const current = item.progress_current ?? 0;
  const total = item.progress_total;

  if (total == null || total <= 0) {
    // Movies are usually tracked as a single watch rather than partial
    // progress — assume the full runtime is left instead of giving up.
    return type === 'movie' ? DEFAULT_MOVIE_MINUTES : null;
  }

  const remainingUnits = Math.max(total - current, 0);
  return Math.round(remainingUnits * MINUTES_PER_UNIT[type]);
}

/** Whether an item's estimated remaining time fits within the given budget. */
export function fitsBudget(item: EstimateItem, budgetMinutes: number): boolean {
  const estimate = estimateRemainingMinutes(item);
  return estimate != null && estimate <= budgetMinutes;
}
