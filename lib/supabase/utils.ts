import { DateTime } from 'luxon';

const GREEK_TIMEZONE = 'Europe/Athens';

/**
 * Get current date/time in Greek timezone
 */
export function getGreekDateTime() {
  return DateTime.now().setZone(GREEK_TIMEZONE);
}

/**
 * Convert ISO string to Greek timezone
 */
export function toGreekDateTime(isoString: string) {
  return DateTime.fromISO(isoString).setZone(GREEK_TIMEZONE);
}

/**
 * Format date for display in Greek format
 */
export function formatGreekDate(date: DateTime | string) {
  const dt = typeof date === 'string' ? DateTime.fromISO(date) : date;
  return dt.setZone(GREEK_TIMEZONE).toFormat('dd/MM/yyyy HH:mm');
}

/**
 * Get ISO string in Greek timezone
 */
export function toGreekISO(date: DateTime | Date) {
  if (date instanceof Date) {
    return DateTime.fromJSDate(date).setZone(GREEK_TIMEZONE).toISO();
  }
  return date.setZone(GREEK_TIMEZONE).toISO();
}
