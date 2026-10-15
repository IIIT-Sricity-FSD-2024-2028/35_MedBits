/**
 * StaffActionButtons.jsx — Unified Branch Admin Staff Row Action Buttons
 * =========================================================================
 * Provides standardized View, Edit, and Delete action buttons across
 * staff rosters (Front Desk, Lab Technicians, Doctors).
 *
 * PROPS:
 *  @param {object}   staff      - The staff record for the current row
 *  @param {function} onView     - Callback invoked when "View" button is clicked
 *  @param {function} onEdit     - Callback invoked when "Edit" (✏️) button is clicked
 *  @param {function} onDelete   - Callback invoked when "Delete" (🗑️) button is clicked
 *  @param {boolean}  disabled   - Whether action buttons are disabled (e.g. during requests)
 */

import React from 'react';
import './StaffActionButtons.css';

export default function StaffActionButtons({
  staff,
  onView,
  onEdit,
  onDelete,
  disabled = false,
}) {
  return (
    <div className="staff-actions-cell">
      {onView && (
        <button
          type="button"
          className="staff-btn-view"
          onClick={() => onView(staff)}
          disabled={disabled}
          title="View Staff Details"
        >
          👁 View
        </button>
      )}

      {onEdit && (
        <button
          type="button"
          className="staff-btn-icon"
          onClick={() => onEdit(staff)}
          disabled={disabled}
          title="Edit Staff Member"
        >
          ✏️
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          className="staff-btn-icon delete"
          onClick={() => onDelete(staff)}
          disabled={disabled}
          title="Remove Staff Member"
        >
          🗑️
        </button>
      )}
    </div>
  );
}
