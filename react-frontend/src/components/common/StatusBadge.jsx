/**
 * StatusBadge.jsx — Universal Status Indicator Pill Component
 * ==============================================================
 * Standardizes status pills across MedBits for:
 *   - Appointments: 'upcoming', 'completed', 'cancelled'
 *   - Queue tokens: 'in-consultation', 'waiting', 'done', 'checked in'
 *
 * PROPS:
 *  @param {string} status     - The status key or label string
 *  @param {string} label      - Optional custom text override
 *  @param {string} className  - Optional extra CSS classes
 *  @param {object} style      - Optional inline style overrides
 */

import React from 'react';
import './StatusBadge.css';

const STATUS_MAP = {
  // Appointments
  upcoming: { variant: 'upcoming', defaultLabel: 'Upcoming' },
  completed: { variant: 'completed', defaultLabel: 'Completed' },
  cancelled: { variant: 'cancelled', defaultLabel: 'Cancelled' },
  canceled: { variant: 'cancelled', defaultLabel: 'Cancelled' },

  // Queue
  'in-consultation': { variant: 'in-consultation', defaultLabel: 'In Consultation' },
  waiting: { variant: 'waiting', defaultLabel: 'Waiting' },
  done: { variant: 'completed', defaultLabel: 'Completed' },
  'checked-in': { variant: 'checked-in', defaultLabel: 'Checked In' },
};

export default function StatusBadge({
  status,
  label,
  className = '',
  style = {},
}) {
  const normalizedKey = (status || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');

  const config = STATUS_MAP[normalizedKey];
  const variant = config?.variant || 'default';

  // Determine display label
  let displayLabel = label;
  if (!displayLabel) {
    if (config?.defaultLabel) {
      displayLabel = config.defaultLabel;
    } else if (status) {
      displayLabel = status.charAt(0).toUpperCase() + status.slice(1);
    } else {
      displayLabel = 'Unknown';
    }
  }

  return (
    <span
      className={`status-badge status-badge-${variant} ${className}`.trim()}
      style={style}
    >
      <span className="status-badge-dot" aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}
