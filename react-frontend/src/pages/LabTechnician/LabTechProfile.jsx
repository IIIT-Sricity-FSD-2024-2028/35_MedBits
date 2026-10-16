/**
 * LabTechProfile.jsx — Lab Technician Profile & Operational Assignment
 * ==============================================================================
 * Utilizes the shared <UserProfile> component configured for the Lab Technician role.
 *
 * NOTE:
 *  - Lab Technician accounts and branch assignments are managed by Branch Administrators.
 *  - This profile is read-only (saveUrl is omitted).
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import UserProfile from '../../components/profile/UserProfile';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function LabTechProfile() {
  const { user } = useAuth();
  const [branchName, setBranchName] = useState('');

  // Fetch branch details to display friendly branch name alongside branchId
  useEffect(() => {
    const branchId = user?.branchId || '00000000-0000-4000-8000-000000000001';
    if (!branchId) return;

    fetch(`${API_BASE_URL}/hospital-branches/${encodeURIComponent(branchId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setBranchName(data.name || data.branchName || data.hospitalName || '');
      })
      .catch(() => {});
  }, [user?.branchId]);

  const labTechFields = [
    { name: 'name', label: 'Full Name', readOnlyAlways: true },
    { name: 'userId', label: 'Technician ID', readOnlyAlways: true },
    { name: 'email', label: 'Email Address', type: 'email', readOnlyAlways: true },
    { name: 'phone', label: 'Contact Phone', type: 'tel', readOnlyAlways: true },
    { name: 'gender', label: 'Gender', readOnlyAlways: true },
    { name: 'roleLabel', label: 'System Role', readOnlyAlways: true },
    { name: 'department', label: 'Department', readOnlyAlways: true },
    { name: 'status', label: 'Account Status', readOnlyAlways: true },
    { name: 'branchName', label: 'Hospital Branch', readOnlyAlways: true },
    { name: 'branchId', label: 'Branch Identifier', fullWidth: true, readOnlyAlways: true },
  ];

  const profileData = {
    name: user?.name || 'Lab Technician',
    userId: user?.userId || user?.id || 'LABTECH_001',
    id: user?.userId || user?.id || 'LABTECH_001',
    email: user?.email || 'labtech@medbits.com',
    phone: user?.phone || '9876543210',
    gender: user?.gender || 'Male',
    roleLabel: 'Lab Technician',
    department: 'Clinical Pathology & Diagnostic Laboratory',
    status: 'Active',
    branchName: branchName || 'Main Branch',
    branchId: user?.branchId || '00000000-0000-4000-8000-000000000001',
  };

  return (
    <UserProfile
      pageTitle="Profile"
      roleLabel="Lab Technician"
      requestRole="labtech"
      fields={labTechFields}
      initialData={profileData}
    />
  );
}
