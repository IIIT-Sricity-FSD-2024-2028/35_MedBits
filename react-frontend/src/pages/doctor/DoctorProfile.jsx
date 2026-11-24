/**
 * DoctorProfile.jsx — Doctor Professional Profile & Clinical Settings
 * ====================================================================
 * Utilizes the shared <UserProfile> component configured for the Doctor role.
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser, updateUserProfile } from '../../store/slices/authSlice';
import UserProfile from '../../components/profile/UserProfile';
import { API_BASE_URL } from '../../api/apiClient';


export default function DoctorProfile() {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

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
      dispatch(
        updateUserProfile({
          name: updatedProfile.name || user.name,
          email: updatedProfile.email || user.email,
        })
      );
    }
  }

  const doctorId = user?.doctorId || (user?.id === 'DOCTOR_001' ? 'DOC001' : user?.id) || 'DOC001';

  return (
    <UserProfile
      pageTitle="Doctor Profile"
      roleLabel="Doctor"
      fetchUrl={`${API_BASE_URL}/doctors/${encodeURIComponent(doctorId)}`}
      saveUrl={`${API_BASE_URL}/doctors/${encodeURIComponent(doctorId)}`}
      requestRole="doctor"
      fields={doctorFields}
      onSaveSuccess={handleSaveSuccess}
    />
  );
}
