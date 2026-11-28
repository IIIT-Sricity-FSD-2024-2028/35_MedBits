/**
 * FrontDeskFormModal.jsx — Front Desk Staff Creation & Edit Modal Dialog
 * =========================================================================
 * Focused component for Branch Admin to manage reception staff, counter
 * assignments, shift schedules, and spoken languages.
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  saveFrontDeskStaff,
  updateFrontDeskFormField,
  setFrontDeskFormErrors,
  setFrontDeskCustomLang,
  addFrontDeskLanguage,
  removeFrontDeskLanguage,
  selectFrontDeskFormData,
  selectFrontDeskFormErrors,
  selectFrontDeskCustomLang,
  selectIsSavingFrontDesk,
  selectFrontDeskSaveError,
} from '../../store/slices/branchAdmin/branchFrontDeskSlice';
import Modal from '../common/Modal';
import { isValidEmail } from './staffHelpers';
import './StaffFormModal.css';

const LANG_PRESETS = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam'];

export default function FrontDeskFormModal({
  isOpen,
  onClose,
  initialData = null,
  branchId: propBranchId,
  onSuccess,
  onSubmit,
}) {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const formData = useSelector(selectFrontDeskFormData);
  const errors = useSelector(selectFrontDeskFormErrors);
  const customLang = useSelector(selectFrontDeskCustomLang);
  const isSubmitting = useSelector(selectIsSavingFrontDesk);
  const submitError = useSelector(selectFrontDeskSaveError);

  if (!isOpen) return null;

  const isEdit = Boolean(initialData);
  const effectiveBranchId = propBranchId || user?.branchId || initialData?.branchId || '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(updateFrontDeskFormField({ name, value }));
  };

  const handleAddLanguage = (langVal) => {
    dispatch(addFrontDeskLanguage(langVal));
  };

  const handleRemoveLanguage = (index) => {
    dispatch(removeFrontDeskLanguage(index));
  };

  const handleLangKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      dispatch(addFrontDeskLanguage(customLang));
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

    dispatch(setFrontDeskFormErrors(errs));
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
        saveFrontDeskStaff({ formData, initialData, branchId: effectiveBranchId })
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
                  onChange={(e) => dispatch(setFrontDeskCustomLang(e.target.value))}
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
