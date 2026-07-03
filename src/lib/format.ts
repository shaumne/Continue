/** Format a minute count as "1h 25m" / "45m" / "2h". */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/**
 * Splits a translated, already-interpolated string around a known
 * substring (the resolved value of an i18n `{{placeholder}}`) so callers
 * can render the surrounding text and the value in different styles —
 * without hardcoding word order, which varies by locale.
 *
 * Falls back to putting everything in `before` when the value isn't found
 * (e.g. an empty string), so rendering degrades gracefully.
 */
export function splitAroundValue(
  text: string,
  value: string,
): { before: string; value: string; after: string } {
  const idx = value ? text.indexOf(value) : -1;
  if (idx === -1) return { before: text, value: '', after: '' };
  return {
    before: text.slice(0, idx),
    value,
    after: text.slice(idx + value.length),
  };
}
