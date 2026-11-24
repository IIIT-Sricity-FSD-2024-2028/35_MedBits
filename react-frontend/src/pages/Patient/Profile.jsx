/**
 * Profile.jsx — Patient Personal Profile & Account Details
 * ====================================================================
 * Utilizes the shared <UserProfile> component configured for the Patient role.
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser, updateUserProfile } from '../../store/slices/authSlice';
import UserProfile from '../../components/profile/UserProfile';
import { API_BASE_URL } from '../../api/apiClient';


export default function PatientProfile() {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

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
      dispatch(
        updateUserProfile({
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          name: `${updatedProfile.firstName} ${updatedProfile.lastName}`.trim(),
          email: updatedProfile.email,
        })
      );
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
