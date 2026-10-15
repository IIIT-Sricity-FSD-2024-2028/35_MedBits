/**
 * StaffDeleteModal.jsx — Reusable Staff Deletion Confirmation Dialog
 * =========================================================================
 * Provides an accessible, consistent confirmation dialog for removing
 * staff members (Front Desk, Lab Techs, Doctors) from a branch.
 *
 * PROPS:
 *  @param {boolean}  isOpen      - Controls modal visibility
 *  @param {function} onClose     - Callback to dismiss the modal
 *  @param {function} onConfirm   - Callback when deletion is confirmed
 *  @param {string}   staffName   - Name of the staff member being removed
 *  @param {string}   roleLabel   - Human-readable role (e.g. 'front desk receptionist')
 *  @param {boolean}  isDeleting  - In-flight request indicator
 */

import React from 'react';
import Modal from '../../../components/common/Modal';
import '../../../components/branch-admin/StaffFormModal.css';
import './StaffDeleteModal.css';

export default function StaffDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  staffName = 'this staff member',
  roleLabel = 'staff member',
  isDeleting = false,
}) {
  if (!isOpen) return null;

  const footer = (
    <>
      <button
        type="button"
        className="staff-footer-btn staff-footer-btn-outline"
        onClick={onClose}
        disabled={isDeleting}
      >
        Cancel
      </button>
      <button
        type="button"
        className="staff-footer-btn staff-delete-confirm-btn"
        onClick={onConfirm}
        disabled={isDeleting}
      >
        {isDeleting ? 'Removing…' : 'Remove Staff Member'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Remove Staff Member"
      subtitle={`Confirm ${roleLabel} removal from this branch`}
      maxWidth="480px"
      footer={footer}
    >
      <div className="staff-delete-body">
        <div className="staff-delete-icon" aria-hidden="true">⚠️</div>
        <div>
          <p className="staff-delete-title">
            Are you sure you want to remove {staffName}?
          </p>
          <p className="staff-delete-desc">
            This {roleLabel} will no longer be listed in your branch's active roster.
            Past operations, appointments, and activity logs will be safely retained.
          </p>
        </div>
      </div>
    </Modal>
  );
}
