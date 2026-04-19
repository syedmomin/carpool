/**
 * Shared date utility for the server to handle Pakistan (UTC+5) localized dates.
 */

/**
 * Returns the current date in Pakistan (UTC+5) as YYYY-MM-DD string.
 */
export function getPakistanToday(): string {
  // Pakistan is UTC+5. We calculate the time in Pakistan by adding 5 hours.
  const now = new Date();
  const pkTime = new Date(now.getTime() + (5 * 60 * 60 * 1000));
  return pkTime.toISOString().split('T')[0];
}

/**
 * Validates if a date string (YYYY-MM-DD) is in the past relative to Pakistan time.
 */
export function isPastDate(dateStr: string): boolean {
  const today = getPakistanToday();
  return dateStr < today;
}
