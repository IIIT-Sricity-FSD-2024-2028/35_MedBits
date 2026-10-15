/**
 * LabTechFormModal.jsx — Lab Technician Creation & Edit Modal Dialog
 * =========================================================================
 * Focused component for Branch Admin to onboard and manage diagnostic
 * pathology lab technicians.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import { API_BASE_URL, isValidEmail, getAuthHeaders } from './staffHelpers';
import './StaffFormModal.css';

function LabTechDialog({ isOpen, onClose, initialData = null, branchId: propBranchId, onSuccess, onSubmit }) {
  const { user } = useAuth();
  const isEdit = Boolean(initialData);
  const effectiveBranchId = propBranchId || user?.branchId || initialData?.branchId || '';

  const [formData, setFormData] = useState(() => ({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    phone: initialData?.phone || '',
    gender: initialData?.gender || '',
    branchId: effectiveBranchId,
  }));

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    if (submitError) setSubmitError(null);
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

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (onSubmit) {
        await onSubmit(formData, isEdit);
        onClose();
        return;
      }

      const techId = initialData?.id || initialData?.userId;
      const endpoint = isEdit
        ? `${API_BASE_URL}/lab-technicians/${encodeURIComponent(techId)}`
        : `${API_BASE_URL}/lab-technicians`;

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
        ...(formData.phone ? { phone: formData.phone.trim() } : {}),
        ...(formData.gender ? { gender: formData.gender } : {}),
      };
      if (!isEdit) payload.password = formData.password;

      const res = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Failed to save lab technician (HTTP ${res.status})`);
      }

      const saved = await res.json().catch(() => ({}));
      onSuccess?.(saved);
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
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

export default function LabTechFormModal(props) {
  if (!props.isOpen) return null;
  const key = props.initialData?.userId || props.initialData?.id || (props.isOpen ? 'open' : 'closed');
  return <LabTechDialog key={key} {...props} />;
}
