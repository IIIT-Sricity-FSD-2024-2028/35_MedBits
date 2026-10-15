/**
 * FrontDeskFormModal.jsx — Front Desk Staff Creation & Edit Modal Dialog
 * =========================================================================
 * Focused component for Branch Admin to manage reception staff, counter
 * assignments, shift schedules, and spoken languages.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import { API_BASE_URL, parseTime24, formatTime12, isValidEmail, getAuthHeaders } from './staffHelpers';
import './StaffFormModal.css';

const LANG_PRESETS = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam'];

function FrontDeskDialog({ isOpen, onClose, initialData = null, branchId: propBranchId, onSuccess, onSubmit }) {
  const { user } = useAuth();
  const isEdit = Boolean(initialData);
  const effectiveBranchId = propBranchId || user?.branchId || initialData?.branchId || '';

  const [formData, setFormData] = useState(() => ({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    phone: initialData?.phone || '',
    gender: initialData?.gender || '',
    counter: initialData?.counter || '',
    shiftStart: parseTime24(initialData?.shiftStart || ''),
    shiftEnd: parseTime24(initialData?.shiftEnd || ''),
    reportingManagerId: initialData?.reportingManagerId || '',
    languages: Array.isArray(initialData?.languages) ? [...initialData.languages] : [],
    branchId: effectiveBranchId,
  }));

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [customLang, setCustomLang] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    if (submitError) setSubmitError(null);
  };

  const handleAddLanguage = (langVal) => {
    const lang = (typeof langVal === 'string' ? langVal : customLang).trim();
    if (!lang) return;
    setFormData((prev) => {
      const current = prev.languages || [];
      if (current.some((l) => l.toLowerCase() === lang.toLowerCase())) return prev;
      return { ...prev, languages: [...current, lang] };
    });
    setCustomLang('');
  };

  const handleRemoveLanguage = (index) => {
    setFormData((prev) => ({
      ...prev,
      languages: (prev.languages || []).filter((_, i) => i !== index),
    }));
  };

  const handleLangKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddLanguage(customLang);
    }
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

      const fdId = initialData?.userId || initialData?.id;
      const endpoint = isEdit
        ? `${API_BASE_URL}/frontdesk/${encodeURIComponent(fdId)}`
        : `${API_BASE_URL}/frontdesk`;

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        branchId: effectiveBranchId,
        ...(formData.phone ? { phone: formData.phone.trim() } : {}),
        ...(formData.gender ? { gender: formData.gender } : {}),
        ...(formData.counter ? { counter: formData.counter.trim() } : {}),
        ...(formData.shiftStart ? { shiftStart: formatTime12(formData.shiftStart) } : {}),
        ...(formData.shiftEnd ? { shiftEnd: formatTime12(formData.shiftEnd) } : {}),
        ...(formData.reportingManagerId ? { reportingManagerId: formData.reportingManagerId.trim() } : {}),
        languages: formData.languages || [],
      };
      if (!isEdit) payload.password = formData.password;

      const res = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Failed to save staff member (HTTP ${res.status})`);
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
      <button type="submit" form="frontDeskFormModal" className="staff-footer-btn staff-footer-btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : isEdit ? '💾 Save Changes' : '🖥️ Add Staff Member'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? '🖥️ Edit Front Desk Staff' : '🖥️ Add Front Desk Staff'}
      subtitle={isEdit ? 'Update desk counter assignment, shift hours, and spoken languages.' : 'Register a front desk receptionist to manage OPD walk-ins.'}
      maxWidth="640px"
      footer={footer}
    >
      <form id="frontDeskFormModal" onSubmit={handleSubmit} className="staff-form-container">
        {submitError && (
          <div className="staff-modal-alert error">
            <span className="staff-modal-alert-icon">⚠️</span>
            <span>{submitError}</span>
          </div>
        )}

        <div className="staff-form-grid">
          <div className="staff-form-group">
            <label className="staff-label" htmlFor="fd-name">
              <span>Full Name <span className="staff-required">*</span></span>
            </label>
            <input
              id="fd-name"
              name="name"
              type="text"
              className={`staff-input ${errors.name ? 'has-error' : ''}`}
              placeholder="Alice Smith"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <span className="staff-error-text">{errors.name}</span>}
          </div>

          <div className="staff-form-group">
            <label className="staff-label" htmlFor="fd-email">
              <span>Email <span className="staff-required">*</span></span>
              {isEdit && <span className="staff-hint">(Read-only)</span>}
            </label>
            <input
              id="fd-email"
              name="email"
              type="email"
              disabled={isEdit}
              className={`staff-input ${errors.email ? 'has-error' : ''}`}
              placeholder="frontdesk@medbits.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className="staff-error-text">{errors.email}</span>}
          </div>

          {!isEdit && (
            <div className="staff-form-group">
              <label className="staff-label" htmlFor="fd-password">
                <span>Password <span className="staff-required">*</span></span>
                <span className="staff-hint">Min. 6 chars</span>
              </label>
              <input
                id="fd-password"
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
            <label className="staff-label" htmlFor="fd-phone">Phone</label>
            <input
              id="fd-phone"
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
            <label className="staff-label" htmlFor="fd-gender">Gender</label>
            <select id="fd-gender" name="gender" className="staff-select" value={formData.gender} onChange={handleChange}>
              <option value="">— Select —</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="staff-form-group">
            <label className="staff-label" htmlFor="fd-counter">Desk / Counter No.</label>
            <input
              id="fd-counter"
              name="counter"
              type="text"
              className="staff-input"
              placeholder="e.g. Counter 1"
              value={formData.counter}
              onChange={handleChange}
            />
          </div>

          <div className="staff-form-group">
            <label className="staff-label" htmlFor="fd-manager">Reporting Manager ID</label>
            <input
              id="fd-manager"
              name="reportingManagerId"
              type="text"
              className="staff-input"
              placeholder="e.g. ADM001"
              value={formData.reportingManagerId}
              onChange={handleChange}
            />
          </div>

          <div className="staff-form-group">
            <label className="staff-label" htmlFor="fd-shiftStart">Shift Start</label>
            <input
              id="fd-shiftStart"
              name="shiftStart"
              type="time"
              className="staff-input"
              value={formData.shiftStart}
              onChange={handleChange}
            />
          </div>

          <div className="staff-form-group">
            <label className="staff-label" htmlFor="fd-shiftEnd">Shift End</label>
            <input
              id="fd-shiftEnd"
              name="shiftEnd"
              type="time"
              className="staff-input"
              value={formData.shiftEnd}
              onChange={handleChange}
            />
          </div>

          {/* Languages Tag Builder */}
          <div className="staff-form-group full-width">
            <label className="staff-label">
              <span>Languages Spoken ({formData.languages?.length || 0})</span>
              <span className="staff-hint">Press Enter to add</span>
            </label>
            <div className="staff-tag-builder">
              <div className="staff-tag-list">
                {(formData.languages || []).length === 0 ? (
                  <span className="staff-empty-tag-note">No languages selected yet.</span>
                ) : (
                  formData.languages.map((l, idx) => (
                    <span key={l} className="staff-tag-chip blue-badge">
                      <span>🗣 {l}</span>
                      <button type="button" className="staff-tag-chip-remove" onClick={() => handleRemoveLanguage(idx)}>×</button>
                    </span>
                  ))
                )}
              </div>
              <div className="staff-tag-input-row">
                <input
                  type="text"
                  className="staff-input"
                  placeholder="e.g. English, Hindi"
                  value={customLang}
                  onChange={(e) => setCustomLang(e.target.value)}
                  onKeyDown={handleLangKeyDown}
                />
                <button type="button" className="staff-tag-add-btn" onClick={() => handleAddLanguage(customLang)}>
                  ＋ Add Language
                </button>
              </div>
              <div className="staff-presets-group">
                <span className="staff-presets-label">Common:</span>
                {LANG_PRESETS.map((lang) => {
                  const added = (formData.languages || []).some((l) => l.toLowerCase() === lang.toLowerCase());
                  return (
                    <button key={lang} type="button" className="staff-preset-pill" disabled={added} onClick={() => handleAddLanguage(lang)}>
                      {added ? `✓ ${lang}` : `+ ${lang}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function FrontDeskFormModal(props) {
  if (!props.isOpen) return null;
  const key = props.initialData?.userId || props.initialData?.id || (props.isOpen ? 'open' : 'closed');
  return <FrontDeskDialog key={key} {...props} />;
}
