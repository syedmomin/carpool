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
/**
 * Converts this app's "h:mm am/pm" time strings (produced by TimePickerInput)
 * into strict 24-hour "HH:MM", which is the format some backend endpoints
 * (e.g. schedule requests) validate against. Returns the input unchanged if
 * it doesn't match the expected 12-hour pattern, so an already-24h value
 * (or a genuinely malformed one) passes through rather than being mangled.
 */
export function to24Hour(time12: string): string {
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec((time12 || '').trim());
  if (!m) return time12;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = m[3].toLowerCase();
  if (ap === 'pm' && h !== 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

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
