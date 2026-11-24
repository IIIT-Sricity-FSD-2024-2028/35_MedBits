/**
 * userHelpers.js — Pure User Display Helpers
 * ============================================================
 */

/**
 * Extracts up to 2 uppercase initials from a user's full name (e.g. "Ria Sharma" -> "RS").
 */
export function getInitials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??'
  );
}
