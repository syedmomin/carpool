/**
 * Pakistani phone number normalization — every phone field in the app (login,
 * register, edit profile) must produce the same on-the-wire format so DB
 * lookups (login-by-phone, uniqueness checks) always match regardless of how
 * the user typed it: with a leading 0 ("03001234567"), with the country code
 * ("923001234567"), or just the 10-digit local number ("3001234567").
 */

/** Strips everything but digits from raw user input. */
export const digitsOnly = (v: string) => v.replace(/[^0-9]/g, '');

/**
 * Normalizes any of the accepted input shapes to the canonical wire format:
 * "92" + 10-digit local number (12 digits total, no "+", no leading 0).
 */
export function normalizePkPhone(raw: string): string {
  const digits = digitsOnly(raw);
  if (digits.startsWith('92') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 11) return '92' + digits.slice(1);
  if (digits.length === 10) return '92' + digits;
  // Fall back to whatever was typed — validation upstream should have caught
  // anything shorter/longer before this is ever called.
  return digits;
}

/**
 * Local-format display value for an input field: strips the "92" country
 * code and re-adds the leading "0" — e.g. "923001234567" -> "03001234567".
 * Used to populate a field from a phone already stored in wire format.
 */
export function toLocalDisplay(wireFormat: string): string {
  const digits = digitsOnly(wireFormat || '');
  if (digits.startsWith('92') && digits.length === 12) return '0' + digits.slice(2);
  if (digits.startsWith('0')) return digits;
  return digits;
}

/** True once the field holds a complete local number: leading 0 + 10 digits (11 total). */
export const isValidLocalPhone = (v: string) => /^0\d{10}$/.test(digitsOnly(v));
