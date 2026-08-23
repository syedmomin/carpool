import { getTodayStr } from './date';

/**
 * Shared helpers for the passenger "history" screens (BookingHistoryScreen,
 * PastBookingsScreen) that need to group a flat list of bookings into
 * month-labelled sections ("May 2024", "April 2024", ...) for a SectionList,
 * and to split terminal bookings into "upcoming" (ride date hasn't happened
 * yet, e.g. a cancellation for a future ride) vs "past" (ride date already
 * happened).
 */

export interface MonthSection<T> {
  title: string;
  key: string;
  data: T[];
}

function getRideDate(item: any): string | undefined {
  return item?.ride?.date || item?.rideDate;
}

/** True when the booking's ride date is today or later (or missing). */
export function isUpcomingByDate(item: any): boolean {
  const date = getRideDate(item);
  if (!date) return false;
  return date >= getTodayStr();
}

function monthKey(dateStr: string): string {
  // dateStr is YYYY-MM-DD -> YYYY-MM
  return dateStr.slice(0, 7);
}

function monthLabel(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Groups items by the month of their ride date, newest month first, and
 * newest date first within each month. Items without a usable date are
 * collected into a trailing "Earlier" section.
 */
export function groupByMonth<T>(items: T[]): MonthSection<T>[] {
  const buckets = new Map<string, { label: string; data: T[] }>();
  const undated: T[] = [];

  for (const item of items) {
    const date = getRideDate(item);
    if (!date) { undated.push(item); continue; }
    const key = monthKey(date);
    if (!buckets.has(key)) buckets.set(key, { label: monthLabel(date), data: [] });
    buckets.get(key)!.data.push(item);
  }

  const sortedKeys = Array.from(buckets.keys()).sort((a, b) => b.localeCompare(a));
  const sections: MonthSection<T>[] = sortedKeys.map(key => {
    const bucket = buckets.get(key)!;
    const data = [...bucket.data].sort((a, b) => {
      const da = getRideDate(a) || '';
      const db = getRideDate(b) || '';
      return db.localeCompare(da);
    });
    return { title: bucket.label, key, data };
  });

  if (undated.length) sections.push({ title: 'Earlier', key: 'earlier', data: undated });
  return sections;
}
