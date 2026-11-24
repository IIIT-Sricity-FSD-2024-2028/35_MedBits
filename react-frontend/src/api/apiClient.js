/**
 * apiClient.js — Centralized API Configuration
 * ============================================================
 * Single source of truth for:
 *   1. The backend base URL (read from VITE_API_URL env var)
 *   2. Building request headers for every actor role
 *   3. A generic apiFetch() helper that wraps fetch() with
 *      consistent error handling
 *
 * WHY THIS FILE EXISTS:
 *   Before, every page component had its own copy of:
 *     const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
 *   This was declared in 25+ files. If the backend port or URL
 *   ever changes, you'd need to update all 25+ places.
 *   Now you only change one line here.
 *
 * USAGE:
 *   import { API_BASE_URL, apiFetch, getRequestHeaders } from '../../api/apiClient';
 *
 *   // Fetch all appointments
 *   const data = await apiFetch('/appointments', { user });
 *
 *   // Post a new appointment
 *   const result = await apiFetch('/appointments', {
 *     user,
 *     method: 'POST',
 *     body: { patientId: 'PAT001', doctorId: 'DOC001', date: '2026-11-25' },
 *   });
 */

// ── 1. Base URL ──────────────────────────────────────────────────────────────
/**
 * The backend base URL.
 * Set VITE_API_URL in your .env file to override (e.g. for staging/production).
 * Falls back to localhost:3000 for local development.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ── 2. Standard Request Headers ──────────────────────────────────────────────
/**
 * getRequestHeaders(user, extra?)
 *
 * Builds the standard set of HTTP headers for a backend API call.
 * The backend uses `role` for RBAC access control and `x-user-id`
 * to scope queries (e.g. doctor only sees their own appointments).
 *
 * @param {object|null} user   — the logged-in user from AuthContext / Redux auth state
 * @param {object}      extra  — any additional headers to merge in
 * @returns {object} headers object ready for fetch()
 *
 * PREVIOUSLY:
 *   Each component built headers manually, mixing:
 *     • { role: 'doctor' }
 *     • { role: 'patient', 'x-user-id': userId }
 *     • { 'Content-Type': 'application/json', role: user?.role, 'x-user-id': user?.id }
 *
 * NOW:
 *   All components call getRequestHeaders(user) for a consistent, complete header set.
 */
export function getRequestHeaders(user, extra = {}) {
  return {
    'Content-Type': 'application/json',
    role: user?.role || '',
    'x-user-id': user?.id || user?.userId || '',
    ...extra,
  };
}

// ── 3. Generic Fetch Wrapper ─────────────────────────────────────────────────
/**
 * apiFetch(path, options?)
 *
 * A thin wrapper around the native fetch() that:
 *   - Prepends API_BASE_URL automatically so callers only write '/appointments'
 *   - Attaches standard auth headers from the user object
 *   - Accepts a plain JS object as `body` and serializes it to JSON
 *   - Throws a descriptive Error on non-2xx HTTP responses (instead of
 *     silently returning a failed Response object)
 *   - Passes `cache: 'no-store'` by default to prevent stale data
 *
 * @param {string} path     — the API endpoint path, e.g. '/appointments'
 * @param {object} options  — optional config
 * @param {object|null} options.user       — user object (for auth headers)
 * @param {string}      options.method     — HTTP verb: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
 * @param {object}      options.body       — request payload (plain JS object; auto-serialized)
 * @param {object}      options.headers    — extra headers to merge
 * @param {string}      options.cache      — fetch cache mode (default: 'no-store')
 * @returns {Promise<any>} — the parsed JSON response body
 * @throws {Error} — with a descriptive message on HTTP errors or network failure
 *
 * USAGE EXAMPLES:
 *   // GET  /appointments
 *   const appointments = await apiFetch('/appointments', { user });
 *
 *   // POST /appointments  with a JSON body
 *   const created = await apiFetch('/appointments', {
 *     user,
 *     method: 'POST',
 *     body: { patientId, doctorId, date, slot },
 *   });
 *
 *   // PATCH /lab-requests/REQ001/accept
 *   await apiFetch('/lab-requests/REQ001/accept', { user, method: 'PATCH' });
 *
 *   // DELETE /appointments/APT001
 *   await apiFetch('/appointments/APT001', { user, method: 'DELETE' });
 */
export async function apiFetch(path, options = {}) {
  const {
    user    = null,
    method  = 'GET',
    body    = undefined,
    headers = {},
    cache   = 'no-store',
  } = options;

  const url = `${API_BASE_URL}${path}`;

  const fetchOptions = {
    method,
    headers: getRequestHeaders(user, headers),
    cache,
  };

  // Only attach body for non-GET requests that have a payload
  if (body !== undefined && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (networkError) {
    throw new Error(
      `Network error — could not reach ${url}. ` +
      `Is the backend running? (${networkError.message})`
    );
  }

  if (!response.ok) {
    // Try to extract a backend error message, fall back to HTTP status text
    let detail = '';
    try {
      const errBody = await response.json();
      detail = errBody?.message || errBody?.error || '';
    } catch {
      detail = response.statusText;
    }
    throw new Error(
      `API Error ${response.status} on ${method} ${path}` +
      (detail ? `: ${detail}` : '')
    );
  }

  // 204 No Content — return null instead of trying to parse an empty body
  if (response.status === 204) return null;

  return response.json();
}
