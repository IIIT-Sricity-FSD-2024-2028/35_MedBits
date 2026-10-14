/**
 * AppointmentStatusBadge.jsx — Appointment Status Badge Component
 * =========================================================================
 * Renders consistent, accessible status pills for appointments:
 *  - upcoming  → Blue pill with status dot
 *  - completed → Emerald green pill with status dot
 *  - cancelled → Crimson red pill with status dot
 *
 * PROPS:
 *  @param {string} status - Appointment status string (e.g. 'upcoming', 'completed', 'cancelled')
 */

import React from 'react';
import StatusBadge from '../../../components/common/StatusBadge';

export default function AppointmentStatusBadge({ status, className, style }) {
  return <StatusBadge status={status} className={className} style={style} />;
}
