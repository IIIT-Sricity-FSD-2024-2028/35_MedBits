/**
 * Profile.jsx — Patient Personal Profile & Account Details
 * ====================================================================
 * Utilizes the shared <UserProfile> component configured for the Patient role.
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import UserProfile from '../../components/profile/UserProfile';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function PatientProfile() {
  const { user, login } = useAuth();

  const patientFields = [
    { name: 'firstName', label: 'First Name', required: true },
    { name: 'lastName', label: 'Last Name', required: true },
    { name: 'dob', label: 'Date Of Birth', placeholder: 'YYYY-MM-DD' },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      options: ['Male', 'Female', 'Other'],
    },
    { name: 'bloodGroup', label: 'Blood Group', placeholder: 'e.g. O+, A+, B+' },
    { name: 'phone', label: 'Phone Number', type: 'tel' },
    { name: 'email', label: 'Email Address', type: 'email', fullWidth: true, required: true },
    { name: 'guardianName', label: "Guardian's Name", placeholder: 'Parent / Guardian Name', fullWidth: true },
  ];

  function handleSaveSuccess(updatedProfile) {
    if (user) {
      login({
        ...user,
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        name: `${updatedProfile.firstName} ${updatedProfile.lastName}`.trim(),
        email: updatedProfile.email,
      });
    }
  }

  return (
    <UserProfile
      pageTitle="Patient Profile"
      roleLabel="Patient"
      fetchUrl={user?.id ? `${API_BASE_URL}/patients/${encodeURIComponent(user.id)}` : null}
      saveUrl={user?.id ? `${API_BASE_URL}/patients/${encodeURIComponent(user.id)}` : null}
      requestRole="patient"
      fields={patientFields}
      onSaveSuccess={handleSaveSuccess}
    />
  );
}
