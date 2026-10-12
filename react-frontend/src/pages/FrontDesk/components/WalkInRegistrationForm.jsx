/**
 * WalkInRegistrationForm.jsx — Front Desk Walk-in Registration Form
 * =========================================================================
 * Form component responsible for collecting new arriving walk-in patient
 * details. Uses reusable FormField components for standardized input
 * styling and inline validation error presentation.
 *
 * PROPS:
 *  @param {object} formData     - Controlled form field values
 *  @param {object} formErrors   - Field validation error strings
 *  @param {boolean} isSubmitting - Whether submission API call is in progress
 *  @param {function} onChange   - Input change event handler
 *  @param {function} onSubmit   - Form submit event handler
 *  @param {function} onClear    - Form clear/reset event handler
 */

import React from 'react';
import ContentCard from '../../../components/dashboard/ContentCard';
import FormField from '../../../components/common/FormField';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const MAX_DOB_DATE = new Date().toISOString().slice(0, 10);

export default function WalkInRegistrationForm({
  formData,
  formErrors,
  isSubmitting,
  onChange,
  onSubmit,
  onClear,
}) {

  return (
    <ContentCard
      title="New Walk-in Patient Registration"
      subtitle="Enter arriving patient details. The system will register the patient and assign a walk-in token."
    >
      <form onSubmit={onSubmit} noValidate>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          {/* First Name */}
          <FormField
            label="First Name"
            name="firstName"
            type="text"
            placeholder="e.g. Rahul"
            value={formData.firstName}
            onChange={onChange}
            error={formErrors.firstName}
            required
            disabled={isSubmitting}
          />

          {/* Last Name */}
          <FormField
            label="Last Name"
            name="lastName"
            type="text"
            placeholder="e.g. Sharma"
            value={formData.lastName}
            onChange={onChange}
            error={formErrors.lastName}
            required
            disabled={isSubmitting}
          />

          {/* Email Address */}
          <FormField
            label="Email Address"
            name="email"
            type="email"
            placeholder="e.g. rahul.sharma@example.com"
            value={formData.email}
            onChange={onChange}
            error={formErrors.email}
            required
            disabled={isSubmitting}
          />

          {/* Phone Number */}
          <FormField
            label="Phone Number (10 digits)"
            name="phone"
            type="tel"
            maxLength={10}
            placeholder="e.g. 9876543210"
            value={formData.phone}
            onChange={onChange}
            error={formErrors.phone}
            required
            disabled={isSubmitting}
          />

          {/* Date of Birth */}
          <FormField
            label="Date of Birth"
            name="dob"
            type="date"
            max={MAX_DOB_DATE}
            value={formData.dob}
            onChange={onChange}
            error={formErrors.dob}
            required
            disabled={isSubmitting}
          />

          {/* Gender */}
          <FormField
            label="Gender"
            name="gender"
            type="select"
            placeholder="Select Gender..."
            options={GENDER_OPTIONS}
            value={formData.gender}
            onChange={onChange}
            error={formErrors.gender}
            required
            disabled={isSubmitting}
          />

          {/* Blood Group */}
          <FormField
            label="Blood Group"
            name="bloodGroup"
            type="select"
            placeholder="Select Blood Group..."
            options={BLOOD_GROUP_OPTIONS}
            value={formData.bloodGroup}
            onChange={onChange}
            error={formErrors.bloodGroup}
            required
            disabled={isSubmitting}
          />

          {/* Guardian Name (Optional) */}
          <FormField
            label="Guardian Name"
            name="guardianName"
            type="text"
            placeholder="e.g. Suresh Sharma"
            value={formData.guardianName}
            onChange={onChange}
            optional
            disabled={isSubmitting}
          />
        </div>

        {/* Form Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: isSubmitting ? '#93c5fd' : '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{isSubmitting ? 'Registering Patient...' : 'Register Walk-in Patient'}</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            Clear Form
          </button>
        </div>
      </form>
    </ContentCard>
  );
}
