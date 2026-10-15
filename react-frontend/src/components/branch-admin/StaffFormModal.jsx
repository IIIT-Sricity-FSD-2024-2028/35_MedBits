/**
 * StaffFormModal.jsx — Unified Branch Admin Staff Modal Entry Point
 * =========================================================================
 * Dispatches to individual focused modal components:
 *   - DoctorFormModal.jsx
 *   - FrontDeskFormModal.jsx
 *   - LabTechFormModal.jsx
 */

import React from 'react';
import DoctorFormModal from './DoctorFormModal';
import FrontDeskFormModal from './FrontDeskFormModal';
import LabTechFormModal from './LabTechFormModal';

export default function StaffFormModal({ role = 'doctor', ...props }) {
  const normalized = String(role).toLowerCase().replace(/[-_]/g, '');

  if (normalized.includes('front')) {
    return <FrontDeskFormModal {...props} />;
  }

  if (normalized.includes('lab')) {
    return <LabTechFormModal {...props} />;
  }

  return <DoctorFormModal {...props} />;
}

// Re-export individual modal components for modular usage
export {
  DoctorFormModal,
  FrontDeskFormModal,
  LabTechFormModal,
  StaffFormModal as CreateStaffModal,
};
