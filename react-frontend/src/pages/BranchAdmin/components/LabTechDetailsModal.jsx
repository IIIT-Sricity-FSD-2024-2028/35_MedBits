/**
 * LabTechDetailsModal.jsx — Lab Technician Staff Profile Inspection Dialog
 * =========================================================================
 * Displays comprehensive diagnostic credentials, assigned branch, contact details,
 * and pathology lab responsibilities for a certified lab technician.
 *
 * PROPS:
 *  @param {boolean}  isOpen      - Controls modal visibility
 *  @param {function} onClose     - Callback to dismiss the modal
 *  @param {object}   technician - Lab technician record being viewed
 *  @param {function} onEdit      - Callback to transition to the Edit modal
 */

import React from 'react';
import Modal from '../../../components/common/Modal';
import { getInitials, formatDate } from '../utils/staffHelpers';
import '../../../components/branch-admin/StaffFormModal.css';
import './LabTechDetailsModal.css';

export default function LabTechDetailsModal({
  isOpen,
  onClose,
  technician,
  onEdit,
}) {
  if (!isOpen || !technician) return null;

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
            onEdit(technician);
          }}
        >
          ✏️ Edit Technician
        </button>
      )}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔬 Lab Technician Profile"
      subtitle="Pathology laboratory credentials, contact info, and diagnostic duties"
      maxWidth="640px"
      footer={footer}
    >
      <div>
        {/* Profile Card Header */}
        <div className="lt-view-header">
          <div className="lt-view-avatar">{getInitials(technician.name)}</div>
          <div>
            <div className="lt-view-name">{technician.name || '—'}</div>
            <div className="lt-view-meta">
              <span>{technician.email || '—'}</span>
              <span>·</span>
              <span className="lt-id-badge">
                ID: {technician.id || technician.userId || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="lt-details-grid">
          <div className="lt-detail-item">
            <span className="lt-detail-label">Designation / Role</span>
            <span className="lt-detail-val">Certified Diagnostic Lab Technician</span>
          </div>

          <div className="lt-detail-item">
            <span className="lt-detail-label">Laboratory Unit</span>
            <span className="lt-detail-val">Pathology & Clinical Biochemistry</span>
          </div>

          <div className="lt-detail-item">
            <span className="lt-detail-label">Contact Phone</span>
            <span className="lt-detail-val">{technician.phone || '—'}</span>
          </div>

          <div className="lt-detail-item">
            <span className="lt-detail-label">Gender</span>
            <span className="lt-detail-val">{technician.gender || '—'}</span>
          </div>

          <div className="lt-detail-item">
            <span className="lt-detail-label">Registered Date</span>
            <span className="lt-detail-val">
              {formatDate(technician.createdAt)}
            </span>
          </div>

          <div className="lt-detail-item">
            <span className="lt-detail-label">Assigned Branch ID</span>
            <span className="lt-detail-val" style={{ fontSize: '12px' }}>
              {technician.branchId || '—'}
            </span>
          </div>

          <div className="lt-detail-item full">
            <span className="lt-detail-label">Laboratory Workflow Responsibilities</span>
            <div className="lt-responsibility-list">
              <div className="lt-resp-item">
                <span>🧪</span>
                <span>Specimen Collection & Accessioning</span>
              </div>
              <div className="lt-resp-item">
                <span>🔬</span>
                <span>Diagnostic Pathology Analysis</span>
              </div>
              <div className="lt-resp-item">
                <span>📊</span>
                <span>Test Result Recording & QA</span>
              </div>
              <div className="lt-resp-item">
                <span>📤</span>
                <span>Doctor Report Dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
