/**
 * DoctorFormModal.jsx — Doctor Creation & Edit Modal Dialog
 * =========================================================================
 * Focused component for Branch Admin to create and update branch doctors,
 * manage consultation fee / cut, and schedule available OPD time slots.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import { API_BASE_URL, formatTime12, isValidEmail, getAuthHeaders } from './staffHelpers';
import './StaffFormModal.css';

const TIME_PRESETS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];

function DoctorDialog({ isOpen, onClose, initialData = null, branchId: propBranchId, onSuccess, onSubmit }) {
  const { user } = useAuth();
  const isEdit = Boolean(initialData);
  const effectiveBranchId = propBranchId || user?.branchId || initialData?.branchId || '';

  const [formData, setFormData] = useState(() => ({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    specialization: initialData?.specialization || '',
    department: initialData?.department || '',
    qualification: initialData?.qualification || '',
    experience: initialData?.experience ?? '',
    consultationFee: initialData?.consultationFee ?? '',
    percentageCut: initialData?.percentageCut ?? '',
    age: initialData?.age ?? '',
    gender: initialData?.gender || '',
    phone: initialData?.phone || '',
    licenseNo: initialData?.licenseNo || '',
    bio: initialData?.bio || '',
    slots: Array.isArray(initialData?.slots) ? [...initialData.slots] : [],
    branchId: effectiveBranchId,
  }));

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [customSlot, setCustomSlot] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    if (submitError) setSubmitError(null);
  };

  const handleAddSlot = (slotVal) => {
    const slot = (slotVal || formatTime12(customSlot)).trim();
    if (!slot) return;
    setFormData((prev) => {
      const current = prev.slots || [];
      if (current.includes(slot)) return prev;
      return { ...prev, slots: [...current, slot] };
    });
    setCustomSlot('');
  };

  const handleRemoveSlot = (index) => {
    setFormData((prev) => ({
      ...prev,
      slots: (prev.slots || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddStandardSchedule = () => {
    setFormData((prev) => {
      const current = new Set(prev.slots || []);
      TIME_PRESETS.forEach((slot) => current.add(slot));
      return { ...prev, slots: Array.from(current) };
    });
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

      const docId = initialData?.userId || initialData?.id;
      const endpoint = isEdit
        ? `${API_BASE_URL}/doctors/${encodeURIComponent(docId)}`
        : `${API_BASE_URL}/doctors`;

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        specialization: formData.specialization.trim(),
        branchId: effectiveBranchId,
        slots: formData.slots || [],
        ...(formData.department ? { department: formData.department.trim() } : {}),
        ...(formData.qualification ? { qualification: formData.qualification.trim() } : {}),
        ...(formData.gender ? { gender: formData.gender } : {}),
        ...(formData.phone ? { phone: formData.phone.trim() } : {}),
        ...(formData.licenseNo ? { licenseNo: formData.licenseNo.trim() } : {}),
        ...(formData.bio ? { bio: formData.bio.trim() } : {}),
      };

      if (formData.experience !== '') payload.experience = Number(formData.experience);
      if (formData.age !== '') payload.age = Number(formData.age);
      if (formData.consultationFee !== '') payload.consultationFee = Number(formData.consultationFee);
      if (formData.percentageCut !== '') payload.percentageCut = Number(formData.percentageCut);
      if (!isEdit) payload.password = formData.password;

      const res = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders(user),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Failed to save doctor (HTTP ${res.status})`);
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
                  onChange={(e) => setCustomSlot(e.target.value)}
                />
                <button type="button" className="staff-tag-add-btn" onClick={() => handleAddSlot()}>
                  ＋ Add Slot
                </button>
              </div>
              <div className="staff-presets-group">
                <span className="staff-presets-label">Quick:</span>
                {TIME_PRESETS.map((p) => {
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

export default function DoctorFormModal(props) {
  if (!props.isOpen) return null;
  const key = props.initialData?.userId || props.initialData?.id || (props.isOpen ? 'open' : 'closed');
  return <DoctorDialog key={key} {...props} />;
}
