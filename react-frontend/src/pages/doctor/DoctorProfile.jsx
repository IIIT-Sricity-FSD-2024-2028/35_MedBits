/**
 * DoctorProfile.jsx — Doctor Professional Profile & Clinical Settings
 * ====================================================================
 * Utilizes the shared <UserProfile> component configured for the Doctor role.
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import UserProfile from '../../components/profile/UserProfile';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function DoctorProfile() {
  const { user, login } = useAuth();

  const doctorFields = [
    { name: 'name', label: 'Doctor Full Name', required: true },
    { name: 'specialization', label: 'Specialization (e.g. Cardiologist)', required: true },
    { name: 'department', label: 'Department' },
    { name: 'qualification', label: 'Qualification (e.g. MBBS, MD)' },
    { name: 'experience', label: 'Years of Experience', type: 'number' },
    { name: 'licenseNo', label: 'Medical License Number' },
    { name: 'phone', label: 'Contact Phone', type: 'tel' },
    { name: 'email', label: 'Email Address', type: 'email', required: true },
    { name: 'consultationFee', label: 'Consultation Fee (₹)', type: 'number' },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      options: ['Male', 'Female', 'Other'],
    },
    { name: 'bio', label: 'Professional Biography / Summary', type: 'textarea', fullWidth: true },
  ];

  function handleSaveSuccess(updatedProfile) {
    if (user) {
      login({
        ...user,
        name: updatedProfile.name || user.name,
        email: updatedProfile.email || user.email,
      });
    }
  }

  return (
    <UserProfile
      pageTitle="Doctor Profile"
      roleLabel="Doctor"
      fetchUrl={user?.id ? `${API_BASE_URL}/doctors/${encodeURIComponent(user.id)}` : null}
      saveUrl={user?.id ? `${API_BASE_URL}/doctors/${encodeURIComponent(user.id)}` : null}
      requestRole="doctor"
      fields={doctorFields}
      onSaveSuccess={handleSaveSuccess}
    />
  );
}
