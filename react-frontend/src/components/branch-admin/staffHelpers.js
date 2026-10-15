/**
 * staffHelpers.js — Common utility helpers for Branch Admin staff modals
 * =========================================================================
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getAuthHeaders(user) {
  return {
    'Content-Type': 'application/json',
    role: user?.role || 'branch_admin',
    'x-user-id': user?.id || user?.userId || '',
  };
}
