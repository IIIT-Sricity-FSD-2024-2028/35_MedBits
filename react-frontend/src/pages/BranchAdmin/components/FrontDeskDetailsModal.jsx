/**
 * FrontDeskDetailsModal.jsx — Front Desk Staff Profile Inspection Dialog
 * =========================================================================
 * Displays comprehensive operational credentials, counter assignment,
 * shift schedule, and spoken languages for a front desk receptionist.
 *
 * PROPS:
 *  @param {boolean}  isOpen   - Controls modal visibility
 *  @param {function} onClose  - Callback to dismiss the modal
 *  @param {object}   staff    - Front desk staff record being viewed
 *  @param {function} onEdit   - Callback to transition to the Edit modal
 */

import React from 'react';
import Modal from '../../../components/common/Modal';
import { getInitials, formatShift } from '../utils/staffHelpers';
import '../../../components/branch-admin/StaffFormModal.css';
import './FrontDeskDetailsModal.css';

export default function FrontDeskDetailsModal({
  isOpen,
  onClose,
  staff,
  onEdit,
}) {
  if (!isOpen || !staff) return null;

  const footer = (
    <>
      <button
        type="button"
        className="staff-footer-btn staff-footer-btn-outline"
        onClick={onClose}
      >
        Close
      </button>
      {onEdit && (
        <button
          type="button"
          className="staff-footer-btn staff-footer-btn-primary"
          onClick={() => {
            onClose();
            onEdit(staff);
          }}
        >
          ✏️ Edit Staff
        </button>
      )}
    </>
  );

  const languages = Array.isArray(staff.languages) ? staff.languages : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🖥️ Front Desk Staff Profile"
      subtitle="Operational schedule, counter assignment, and profile details"
      maxWidth="640px"
      footer={footer}
    >
      <div>
        {/* Profile Card Header */}
        <div className="fd-view-header">
          <div className="fd-view-avatar">{getInitials(staff.name)}</div>
          <div>
            <div className="fd-view-name">{staff.name || '—'}</div>
            <div className="fd-view-meta">
              <span>{staff.email || '—'}</span>
              <span>·</span>
              <span className="fd-id-badge">
                ID: {staff.userId || staff.id || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="fd-details-grid">
          <div className="fd-detail-item">
            <span className="fd-detail-label">Counter Assignment</span>
            <span className="fd-detail-val">{staff.counter || 'Unassigned'}</span>
          </div>

          <div className="fd-detail-item">
            <span className="fd-detail-label">Shift Hours</span>
            <span className="fd-detail-val">
              {formatShift(staff.shiftStart, staff.shiftEnd)}
            </span>
          </div>

          <div className="fd-detail-item">
            <span className="fd-detail-label">Contact Phone</span>
            <span className="fd-detail-val">{staff.phone || '—'}</span>
          </div>

          <div className="fd-detail-item">
            <span className="fd-detail-label">Gender</span>
            <span className="fd-detail-val">{staff.gender || '—'}</span>
          </div>

          <div className="fd-detail-item">
            <span className="fd-detail-label">Reporting Manager ID</span>
            <span className="fd-detail-val">{staff.reportingManagerId || '—'}</span>
          </div>

          <div className="fd-detail-item">
            <span className="fd-detail-label">Branch ID</span>
            <span className="fd-detail-val" style={{ fontSize: '12px' }}>
              {staff.branchId || '—'}
            </span>
          </div>

          <div className="fd-detail-item full">
            <span className="fd-detail-label">Languages Spoken</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {languages.length > 0 ? (
                languages.map((lang) => (
                  <span key={lang} className="fd-lang-chip">
                    🗣️ {lang}
                  </span>
                ))
              ) : (
                <span className="fd-detail-val" style={{ color: 'var(--text-muted)' }}>
                  No languages listed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
