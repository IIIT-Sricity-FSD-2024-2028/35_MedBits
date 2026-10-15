/**
 * staffHelpers.js — Branch Admin Staff Management Utility Functions
 * =========================================================================
 * Centralized utility helpers for Branch Admin staff modules (Front Desk,
 * Lab Technicians, Doctors):
 *  - API configuration & endpoint routing
 *  - Time format conversions (12h <-> 24h)
 *  - Email validation
 *  - Branch-scoped authentication headers (role & x-user-id)
 *  - String and display formatting (initials, shift hours)
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/** Parses 12-hour AM/PM time string to 24-hour "HH:MM" format for HTML time inputs */
export function parseTime24(timeStr) {
  if (!timeStr) return '';
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return timeStr;
  const [, h, m, ampm] = match;
  let hours = parseInt(h, 10);
  if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${m}`;
}

/** Formats 24-hour "HH:MM" string to 12-hour "hh:mm AM/PM" format for storage/display */
export function formatTime12(time24) {
  if (!time24) return '';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return time24;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

/** Validates basic email structure */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Builds request headers with authenticated user credentials
 * Automatically passes role and x-user-id so the backend auto-scopes queries by branchId
 */
export function getAuthHeaders(user) {
  return {
    'Content-Type': 'application/json',
    role: user?.role || 'branch_admin',
    'x-user-id': user?.id || user?.userId || '',
  };
}

/** Extracts two-letter initials from a person's full name */
export function getInitials(name = '') {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

/** Formats shift start and end times for table display */
export function formatShift(shiftStart, shiftEnd) {
  if (shiftStart && shiftEnd) {
    return `${shiftStart} – ${shiftEnd}`;
  }
  return shiftStart || shiftEnd || '—';
}

/** Formats an ISO date string to a localized readable format (e.g. 1 Jan 2026) */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
