/**
 * DoctorFormModal.jsx — Doctor Creation & Edit Modal Dialog
 * =========================================================================
 * Focused component for Branch Admin to create and update branch doctors,
 * manage consultation fee / cut, and schedule available OPD time slots.
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  saveBranchDoctor,
  updateDoctorFormField,
  setDoctorFormErrors,
  setDoctorCustomSlot,
  addDoctorSlot,
  removeDoctorSlot,
  addDoctorStandardSchedule,
  selectDoctorFormData,
  selectDoctorFormErrors,
  selectDoctorCustomSlot,
  selectIsSavingDoctor,
  selectDoctorSaveError,
} from '../../store/slices/branchAdmin/branchDoctorsSlice';
import { DOCTOR_TIME_PRESETS } from '../../store/slices/branchAdmin/branchStaffHelpers';
import Modal from '../common/Modal';
import { isValidEmail } from './staffHelpers';
import './StaffFormModal.css';

export default function DoctorFormModal({
  isOpen,
  onClose,
  initialData = null,
  branchId: propBranchId,
  onSuccess,
  onSubmit,
}) {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const formData = useSelector(selectDoctorFormData);
  const errors = useSelector(selectDoctorFormErrors);
  const customSlot = useSelector(selectDoctorCustomSlot);
  const isSubmitting = useSelector(selectIsSavingDoctor);
  const submitError = useSelector(selectDoctorSaveError);

  if (!isOpen) return null;

  const isEdit = Boolean(initialData);
  const effectiveBranchId = propBranchId || user?.branchId || initialData?.branchId || '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(updateDoctorFormField({ name, value }));
  };

  const handleAddSlot = (slotVal) => {
    dispatch(addDoctorSlot(slotVal));
  };

  const handleRemoveSlot = (index) => {
    dispatch(removeDoctorSlot(index));
  };

  const handleAddStandardSchedule = () => {
    dispatch(addDoctorStandardSchedule());
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

    if (!formData.specialization?.trim()) errs.specialization = 'Specialization is required';
    if (formData.phone && !/^\d{10}$/.test(formData.phone.trim())) {
      errs.phone = '10 digits required';
    }
    if (formData.experience !== '' && Number(formData.experience) < 0) {
      errs.experience = 'Cannot be negative';
    }
    if (formData.consultationFee !== '' && Number(formData.consultationFee) < 0) {
      errs.consultationFee = 'Cannot be negative';
    }
    if (formData.percentageCut !== '') {
      const cut = Number(formData.percentageCut);
      if (cut < 0 || cut > 100) errs.percentageCut = 'Must be between 0% and 100%';
    }

    dispatch(setDoctorFormErrors(errs));
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
        saveBranchDoctor({ formData, initialData, branchId: effectiveBranchId })
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
      <button type="submit" form="doctorFormModal" className="staff-footer-btn staff-footer-btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : isEdit ? '💾 Save Changes' : '🩺 Add Doctor'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? '🩺 Edit Doctor Profile' : '🩺 Add New Doctor'}
      subtitle={isEdit ? 'Update clinical details, consultation fee, and available OPD slots.' : 'Register a doctor with consultation slots for your branch.'}
      maxWidth="720px"
      footer={footer}
    >
      <form id="doctorFormModal" onSubmit={handleSubmit} className="staff-form-container">
        {submitError && (
          <div className="staff-modal-alert error">
            <span className="staff-modal-alert-icon">⚠️</span>
            <span>{submitError}</span>
          </div>
        )}

        <div className="staff-form-grid">
          <div className="staff-form-group">
            <label className="staff-label" htmlFor="df-name">
              <span>Full Name <span className="staff-required">*</span></span>
            </label>
            <input
              id="df-name"
              name="name"
              type="text"
              className={`staff-input ${errors.name ? 'has-error' : ''}`}
              placeholder="Dr. Jane Smith"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <span className="staff-error-text">{errors.name}</span>}
          </div>

          <div className="staff-form-group">
            <label className="staff-label" htmlFor="df-email">
              <span>Email <span className="staff-required">*</span></span>
              {isEdit && <span className="staff-hint">(Read-only)</span>}
            </label>
            <input
              id="df-email"
              name="email"
              type="email"
              disabled={isEdit}
              className={`staff-input ${errors.email ? 'has-error' : ''}`}
              placeholder="doctor@medbits.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className="staff-error-text">{errors.email}</span>}
          </div>

          {!isEdit && (
            <div className="staff-form-group">
              <label className="staff-label" htmlFor="df-password">
                <span>Password <span className="staff-required">*</span></span>
                <span className="staff-hint">Min. 6 chars</span>
              </label>
              <input
                id="df-password"
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
            <label className="staff-label" htmlFor="df-specialization">
              <span>Specialization <span className="staff-required">*</span></span>
            </label>
            <input
              id="df-specialization"
              name="specialization"
              type="text"
              className={`staff-input ${errors.specialization ? 'has-error' : ''}`}
              placeholder="e.g. Cardiology"
              value={formData.specialization}
              onChange={handleChange}
            />
            {errors.specialization && <span className="staff-error-text">{errors.specialization}</span>}
          </div>

          <div className="staff-form-group">
            <label className="staff-label" htmlFor="df-department">Department</label>
            <input
              id="df-department"
              name="department"
              type="text"
              className="staff-input"
              placeholder="e.g. Cardiology OPD"
              value={formData.department}
              onChange={handleChange}
            />
          </div>

          <div className="staff-form-group">
            <label className="staff-label" htmlFor="df-qualification">Qualification</label>
            <input
              id="df-qualification"
              name="qualification"
              type="text"
              className="staff-input"
              placeholder="e.g. MBBS, MD"
              value={formData.qualification}
              onChange={handleChange}
            />
          </div>

          <div className="staff-form-group">
            <label className="staff-label" htmlFor="df-experience">Experience (Years)</label>
            <input
              id="df-experience"
              name="experience"
              type="number"
              min="0"
              max="60"
              className={`staff-input ${errors.experience ? 'has-error' : ''}`}
              placeholder="e.g. 10"
              value={formData.experience}
              onChange={handleChange}
            />
            {errors.experience && <span className="staff-error-text">{errors.experience}</span>}
          </div>

          <div className="staff-form-group">
            <label className="staff-label" htmlFor="df-fee">Consultation Fee (₹)</label>
            <input
              id="df-fee"
              name="consultationFee"
              type="number"
              min="0"
              className={`staff-input ${errors.consultationFee ? 'has-error' : ''}`}
              placeholder="e.g. 500"
              value={formData.consultationFee}
              onChange={handleChange}
            />
            {errors.consultationFee && <span className="staff-error-text">{errors.consultationFee}</span>}
          </div>

          <div className="staff-form-group">
            <label className="staff-label" htmlFor="df-cut">Doctor Cut (%)</label>
            <input
              id="df-cut"
              name="percentageCut"
              type="number"
              min="0"
              max="100"
              className={`staff-input ${errors.percentageCut ? 'has-error' : ''}`}
              placeholder="e.g. 70"
              value={formData.percentageCut}
              onChange={handleChange}
            />
            {errors.percentageCut && <span className="staff-error-text">{errors.percentageCut}</span>}
          </div>

          <div className="staff-form-group">
            <label className="staff-label" htmlFor="df-gender">Gender</label>
            <select id="df-gender" name="gender" className="staff-select" value={formData.gender} onChange={handleChange}>
              <option value="">— Select —</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="staff-form-group">
            <label className="staff-label" htmlFor="df-phone">Phone</label>
            <input
              id="df-phone"
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
            <label className="staff-label" htmlFor="df-license">License No.</label>
            <input
              id="df-license"
              name="licenseNo"
              type="text"
              className="staff-input"
              placeholder="e.g. LIC12345"
              value={formData.licenseNo}
              onChange={handleChange}
            />
          </div>

          <div className="staff-form-group full-width">
            <label className="staff-label" htmlFor="df-bio">Bio</label>
            <textarea
              id="df-bio"
              name="bio"
              className="staff-textarea"
              placeholder="Doctor's clinical background and specialties…"
              value={formData.bio}
              onChange={handleChange}
            />
          </div>

          {/* Slots Builder */}
          <div className="staff-form-group full-width">
            <label className="staff-label">
              <span>Available Slots ({formData.slots?.length || 0})</span>
            </label>
            <div className="staff-tag-builder">
              <div className="staff-tag-list">
                {(formData.slots || []).length === 0 ? (
                  <span className="staff-empty-tag-note">No slots added yet. Pick a time or click quick presets.</span>
                ) : (
                  formData.slots.map((s, idx) => (
                    <span key={s} className="staff-tag-chip">
                      <span>⏱ {s}</span>
                      <button type="button" className="staff-tag-chip-remove" onClick={() => handleRemoveSlot(idx)}>×</button>
                    </span>
                  ))
                )}
              </div>
              <div className="staff-tag-input-row">
                <input
                  type="time"
                  className="staff-input"
                  value={customSlot}
                  onChange={(e) => dispatch(setDoctorCustomSlot(e.target.value))}
                />
                <button type="button" className="staff-tag-add-btn" onClick={() => handleAddSlot()}>
                  ＋ Add Slot
                </button>
              </div>
              <div className="staff-presets-group">
                <span className="staff-presets-label">Quick:</span>
                {DOCTOR_TIME_PRESETS.map((p) => {
                  const added = (formData.slots || []).includes(p);
                  return (
                    <button key={p} type="button" className="staff-preset-pill" disabled={added} onClick={() => handleAddSlot(p)}>
                      {added ? `✓ ${p}` : `+ ${p}`}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="staff-preset-pill"
                  style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                  onClick={handleAddStandardSchedule}
                >
                  ⚡ All Standard OPD Slots
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
