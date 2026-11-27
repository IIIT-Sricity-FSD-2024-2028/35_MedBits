/**
 * labTechHelpers.js — Shared Helpers for Lab Technician Redux Slices & Pages
 * ============================================================================
 * Location: src/store/slices/labTech/labTechHelpers.js
 *
 * Centralizes Lab Technician identity resolution, apiClient user header
 * construction, error message extraction, collection upsert logic, and
 * consistent date extraction / formatting / sorting helpers.
 */

/**
 * Resolves the backend Lab Technician ID for the logged-in user.
 * Maps the offline demo ID 'LABTECH_001' (from Login.jsx) to the
 * seeded backend Lab Technician ID 'LT001'.
 */
export function resolveLabTechId(user) {
  const rawId = (user?.labTechId || user?.userId || user?.id || '').trim();
  if (!rawId || rawId.toUpperCase() === 'LABTECH_001') {
    return 'LT001';
  }
  return rawId;
}

/**
 * Builds the request user object passed to apiFetch so every Lab Technician
 * request sends `role: 'labtech'` and `x-user-id: <resolvedLabTechId>`.
 */
export function getLabTechRequestUser(state) {
  const user = state?.auth?.user || null;
  return {
    ...(user || {}),
    role: 'labtech',
    id: resolveLabTechId(user),
  };
}

/**
 * Extracts a clean, user-facing error message from an apiFetch error.
 */
export function extractErrorMessage(err, fallback = 'Request failed') {
  const raw = err?.message || '';
  if (!raw) return fallback;
  const colonIdx = raw.indexOf(': ');
  if (colonIdx !== -1 && raw.startsWith('API Error ')) {
    return raw.slice(colonIdx + 2) || raw;
  }
  return raw;
}

/**
 * Replaces an existing record matching `item.id` or inserts it into the array.
 */
export function upsertById(list, item, prepend = false) {
  if (!Array.isArray(list)) return item?.id ? [item] : [];
  if (!item?.id) return list;

  const exists = list.some((entry) => entry.id === item.id);
  if (exists) {
    return list.map((entry) => (entry.id === item.id ? item : entry));
  }
  return prepend ? [item, ...list] : [...list, item];
}

/**
 * Extracts the scheduled date string from a backend LabRequest record.
 * Uses `labTestDate`, falling back to `recommendationDate` or `requestDate`.
 */
export function getScheduledDate(record) {
  if (!record) return null;
  return record.labTestDate || record.recommendationDate || record.requestDate || null;
}

/**
 * Returns the appropriate backend date/timestamp for a LabRequest based on its status:
 *   - pending                          -> scheduled date (`labTestDate` / `recommendationDate` / `requestDate`)
 *   - in_progress / accepted / draft   -> `acceptedAt`
 *   - rejected                         -> `rejectedAt`
 *   - completed                        -> `completedAt`
 */
export function getRequestStatusDate(request) {
  if (!request) return null;
  switch (request.status) {
    case 'pending':
      return getScheduledDate(request);
    case 'in_progress':
    case 'accepted':
    case 'draft_report':
      return request.acceptedAt || null;
    case 'rejected':
      return request.rejectedAt || null;
    case 'completed':
      return request.completedAt || null;
    default:
      return null;
  }
}

/**
 * Parses a YYYY-MM-DD date string or ISO timestamp into a numeric epoch ms value,
 * returning NaN when missing or invalid. Avoids timezone day-shifts on bare dates.
 */
function parseDateToTimestamp(value) {
  if (!value || typeof value !== 'string') {
    if (value instanceof Date && Number.isFinite(value.getTime())) {
      return value.getTime();
    }
    return NaN;
  }
  const trimmed = value.trim();
  if (!trimmed) return NaN;

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    return Date.UTC(Number(y), Number(m) - 1, Number(d));
  }

  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? parsed : NaN;
}

/**
 * Formats a backend date string or ISO timestamp consistently across Lab Technician pages.
 * Returns '—' when missing or invalid instead of inventing fallback dates.
 */
export function formatLabDate(value) {
  if (!value) return '—';
  const trimmed = typeof value === 'string' ? value.trim() : '';
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  const date = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3])
      )
    : new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Comparator that sorts request records by scheduled date descending (newest first),
 * placing missing/invalid dates at the end, with createdAt descending as a tie-breaker.
 */
export function compareByScheduledDateDesc(reqA, reqB) {
  const timeA = parseDateToTimestamp(getScheduledDate(reqA));
  const timeB = parseDateToTimestamp(getScheduledDate(reqB));
  const validA = Number.isFinite(timeA);
  const validB = Number.isFinite(timeB);

  if (validA && validB) {
    if (timeB !== timeA) return timeB - timeA;
  } else if (validA !== validB) {
    return validA ? -1 : 1;
  }

  const createdA = parseDateToTimestamp(reqA?.createdAt);
  const createdB = parseDateToTimestamp(reqB?.createdAt);
  if (Number.isFinite(createdA) && Number.isFinite(createdB) && createdB !== createdA) {
    return createdB - createdA;
  }
  return 0;
}

/**
 * Comparator that sorts completed request records by completedAt descending (newest first),
 * falling back to scheduled date and createdAt descending for ties or missing timestamps.
 */
export function compareByCompletedDateDesc(reqA, reqB) {
  const timeA = parseDateToTimestamp(reqA?.completedAt);
  const timeB = parseDateToTimestamp(reqB?.completedAt);
  const validA = Number.isFinite(timeA);
  const validB = Number.isFinite(timeB);

  if (validA && validB) {
    if (timeB !== timeA) return timeB - timeA;
  } else if (validA !== validB) {
    return validA ? -1 : 1;
  }

  return compareByScheduledDateDesc(reqA, reqB);
}

/**
 * Authoritative view model mapper shared by LabReports and TestRequests -> Completed
 * so both pages display the exact same report fields and separate timestamps.
 */
export function buildLabReportViewModel(report, request = null) {
  if (!report) return null;

  return {
    id: report.id || request?.reportId || '—',
    labRequestId: report.labRequestId || request?.id || '—',
    patientId: report.patientId || request?.patientId || '—',
    patientName:
      report.patientName ||
      request?.patientName ||
      report.patientId ||
      request?.patientId ||
      '—',
    doctorName:
      report.doctorName || request?.doctorName || 'Attending Physician',
    testName: report.testName || request?.testName || 'Diagnostic Lab Test',
    technicianName: report.technicianName || 'Certified Lab Technician',
    scheduledDate: getScheduledDate(request),
    completedDate: request?.completedAt || null,
    submittedDate: report.submittedAt || null,
    result: report.result || '',
    findings: report.findings || '',
    remarks: report.remarks || '',
    fileAttachment: report.fileAttachment || null,
    status: report.status || 'submitted',
  };
}

