/**
 * AppointmentActionButtons.jsx — Front Desk Appointment Row Action Buttons
 * =========================================================================
 * Encapsulates the table actions for a single appointment record:
 *   - Reschedule: Opens the reschedule date & slot dialog
 *   - Complete: Marks the appointment completed in 1 click
 *   - Cancel: Opens the appointment cancellation dialog
 *
 * PROPS:
 *  @param {object} appointment   - Appointment record for the current row
 *  @param {function} onReschedule - Callback when user clicks Reschedule
 *  @param {function} onComplete   - Callback when user clicks Complete
 *  @param {function} onCancel     - Callback when user clicks Cancel
 *  @param {boolean} isLoading     - Whether a status update is currently in progress
 */

import React from 'react';
import './AppointmentActionButtons.css';

export default function AppointmentActionButtons({
  appointment,
  onReschedule,
  onComplete,
  onCancel,
  isLoading = false,
}) {
  const isUpcoming = (appointment?.status || '').toLowerCase() === 'upcoming';

  if (!isUpcoming) {
    return (
      <span className="appointment-actions-inactive">
        No actions
      </span>
    );
  }

  return (
    <div className="appointment-action-group">
      {/* Reschedule Button */}
      <button
        type="button"
        className="btn-action-reschedule"
        onClick={() => onReschedule(appointment)}
        title="Reschedule appointment date and time slot"
      >
        Reschedule
      </button>

      {/* Complete Button */}
      <button
        type="button"
        className="btn-action-complete"
        disabled={isLoading}
        onClick={() => onComplete(appointment.id)}
        title="Mark appointment as completed"
      >
        {isLoading ? '...' : 'Complete'}
      </button>

      {/* Cancel Button */}
      <button
        type="button"
        className="btn-action-cancel"
        onClick={() => onCancel(appointment)}
        title="Cancel appointment"
      >
        Cancel
      </button>
    </div>
  );
}
