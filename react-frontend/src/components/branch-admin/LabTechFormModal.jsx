/**
 * LabTechFormModal.jsx — Lab Technician Creation & Edit Modal Dialog
 * =========================================================================
 * Focused component for Branch Admin to onboard and manage diagnostic
 * pathology lab technicians.
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  saveLabTechnician,
  updateLabTechFormField,
  setLabTechFormErrors,
  selectLabTechFormData,
  selectLabTechFormErrors,
  selectIsSavingLabTech,
  selectLabTechSaveError,
} from '../../store/slices/branchAdmin/branchLabTechniciansSlice';
import Modal from '../common/Modal';
import { isValidEmail } from './staffHelpers';
import './StaffFormModal.css';

export default function LabTechFormModal({
  isOpen,
  onClose,
  initialData = null,
  branchId: propBranchId,
  onSuccess,
  onSubmit,
}) {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const formData = useSelector(selectLabTechFormData);
  const errors = useSelector(selectLabTechFormErrors);
  const isSubmitting = useSelector(selectIsSavingLabTech);
  const submitError = useSelector(selectLabTechSaveError);

  if (!isOpen) return null;

  const isEdit = Boolean(initialData);
  const effectiveBranchId = propBranchId || user?.branchId || initialData?.branchId || '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(updateLabTechFormField({ name, value }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name?.trim()) errs.name = 'Full name is required';
    if (!formData.email?.trim()) errs.email = 'Email address is required';
    else if (!isValidEmail(formData.email.trim())) errs.email = 'Valid email is required';

    if (!isEdit) {
      if (!formData.password) errs.password = 'Password is required';
      else if (formData.password.length < 6) errs.password = 'Min. 6 characters';
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.trim())) {
      errs.phone = '10 digits required';
    }

    dispatch(setLabTechFormErrors(errs));
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (onSubmit) {
        await onSubmit(formData, isEdit);
        onClose();
        return;
      }

      const saved = await dispatch(
        saveLabTechnician({ formData, initialData, branchId: effectiveBranchId })
      ).unwrap();
      onSuccess?.(saved);
      onClose();
    } catch {
      // Rejection message is surfaced through Redux `saveError`.
    }
  };

  const footer = (
    <>
      <button type="button" className="staff-footer-btn staff-footer-btn-outline" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </button>
      <button type="submit" form="labTechFormModal" className="staff-footer-btn staff-footer-btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : isEdit ? '💾 Save Changes' : '🔬 Add Lab Technician'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? '🔬 Edit Lab Technician' : '🔬 Add Lab Technician'}
      subtitle={isEdit ? 'Update diagnostic technician credentials and contact details.' : 'Register a certified pathology lab technician for test processing.'}
      maxWidth="560px"
      footer={footer}
    >
      <form id="labTechFormModal" onSubmit={handleSubmit} className="staff-form-container">
        {submitError && (
          <div className="staff-modal-alert error">
            <span className="staff-modal-alert-icon">⚠️</span>
            <span>{submitError}</span>
          </div>
        )}

        <div className="staff-form-grid">
          <div className="staff-form-group">
            <label className="staff-label" htmlFor="lt-name">
              <span>Full Name <span className="staff-required">*</span></span>
            </label>
            <input
              id="lt-name"
              name="name"
              type="text"
              className={`staff-input ${errors.name ? 'has-error' : ''}`}
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <span className="staff-error-text">{errors.name}</span>}
          </div>

          <div className="staff-form-group">
            <label className="staff-label" htmlFor="lt-email">
              <span>Email <span className="staff-required">*</span></span>
              {isEdit && <span className="staff-hint">(Read-only)</span>}
            </label>
            <input
              id="lt-email"
              name="email"
              type="email"
              disabled={isEdit}
              className={`staff-input ${errors.email ? 'has-error' : ''}`}
              placeholder="labtech@medbits.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className="staff-error-text">{errors.email}</span>}
          </div>

          {!isEdit && (
            <div className="staff-form-group">
              <label className="staff-label" htmlFor="lt-password">
                <span>Password <span className="staff-required">*</span></span>
                <span className="staff-hint">Min. 6 chars</span>
              </label>
              <input
                id="lt-password"
                name="password"
                type="password"
                className={`staff-input ${errors.password ? 'has-error' : ''}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <span className="staff-error-text">{errors.password}</span>}
            </div>
          )}

          <div className="staff-form-group">
            <label className="staff-label" htmlFor="lt-phone">Phone</label>
            <input
              id="lt-phone"
              name="phone"
              type="tel"
              maxLength={10}
              className={`staff-input ${errors.phone ? 'has-error' : ''}`}
              placeholder="9876543210"
              value={formData.phone}
              onChange={handleChange}
            />
            {errors.phone && <span className="staff-error-text">{errors.phone}</span>}
          </div>

          <div className="staff-form-group">
            <label className="staff-label" htmlFor="lt-gender">Gender</label>
            <select id="lt-gender" name="gender" className="staff-select" value={formData.gender} onChange={handleChange}>
              <option value="">— Select —</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="staff-form-group full-width">
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              fontSize: '12.5px',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}>
              <strong style={{ color: 'var(--navy)' }}>Diagnostic Pathology Wing:</strong> Lab technicians registered under your branch receive access to manage incoming specimen requests, record test parameters, and submit laboratory reports directly to consulting doctors.
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
