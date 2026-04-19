/**
 * Standardizes date string generation to avoid UTC shifts.
 * Always works in the user's local timezone.
 */

/**
 * Returns a local YYYY-MM-DD string for a given Date object.
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the local YYYY-MM-DD string for "Today".
 */
export function getTodayStr(): string {
  return formatLocalDate(new Date());
}

/**
 * Helper to display a date in a nice format (optional utility)
 */
export function getNiceDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = getTodayStr();
  
  if (dateStr === today) return 'Today';
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === formatLocalDate(tomorrow)) return 'Tomorrow';
  
  return date.toLocaleDateString('en-PK', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}
