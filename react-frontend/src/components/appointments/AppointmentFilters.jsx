/**
 * AppointmentFilters.jsx — Search Filters & Dropdowns Component
 * ==============================================================
 * Location: src/components/appointments/AppointmentFilters.jsx
 *
 * WHAT THIS COMPONENT DOES:
 *  Provides search filters and selection dropdowns for the
 *  Appointments section:
 *    1. Branch selection dropdown (loads branches from backend)
 *    2. Speciality dropdown (DYNAMICALLY derived from doctors at the selected branch)
 *    3. Preferred appointment date picker
 *    4. Doctor name search input
 *    5. Search and Reset filter action buttons
 *
 * DYNAMIC SPECIALTIES:
 *  Specialties are NOT static — they update whenever the selected branch
 *  changes by querying GET /doctors?branchId=:branchId and extracting
 *  the unique clinical specializations available for that branch.
 */

import React, { useState, useEffect } from 'react';
import './AppointmentFilters.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getTodayIso() {
  return new Date().toISOString().split('T')[0];
}

export default function AppointmentFilters({
  branches,
  specialities: specialitiesProp,
  selectedBranch = '',
  selectedSpeciality = '',
  selectedDate = '',
  doctorName = '',
  onBranchChange,
  onSpecialityChange,
  onDateChange,
  onDoctorNameChange,
  onSearch,
  onReset,
  showDoctorSearch = true,
  title = 'Find a Doctor in 2 Easy Steps',
  subtitle = 'Select your branch, clinical specialty, and preferred appointment date',
}) {
  const [internalBranches, setInternalBranches] = useState([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(!branches);

  // 1. Auto-fetch hospital branches from backend if not passed as prop
  useEffect(() => {
    if (branches) return;

    let isMounted = true;
    async function fetchBranches() {
      try {
        const response = await fetch(`${API_BASE_URL}/hospital-branches`, {
          headers: { role: 'patient' },
        });
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setInternalBranches(Array.isArray(data) ? data : []);
          }
        }
      } catch (err) {
        console.error('Failed to load branches:', err);
      } finally {
        if (isMounted) {
          setIsLoadingBranches(false);
        }
      }
    }

    fetchBranches();
    return () => {
      isMounted = false;
    };
  }, [branches]);

  const activeBranches = branches || internalBranches;

  // 2. Dynamically load specialties for the selected branch (NOT static)
  const [dynamicSpecialities, setDynamicSpecialities] = useState([]);
  const [isLoadingSpecialities, setIsLoadingSpecialities] = useState(!specialitiesProp);

  useEffect(() => {
    if (specialitiesProp) return;

    let isMounted = true;
    async function loadSpecialitiesForBranch() {
      setIsLoadingSpecialities(true);
      try {
        const url = selectedBranch
          ? `${API_BASE_URL}/doctors?branchId=${encodeURIComponent(selectedBranch)}`
          : `${API_BASE_URL}/doctors`;

        const response = await fetch(url, {
          headers: { role: 'patient' },
        });

        if (response.ok) {
          const doctorsList = await response.json();
          if (isMounted) {
            const uniqueSpecialties = Array.isArray(doctorsList)
              ? [...new Set(doctorsList.map((d) => d.specialization).filter(Boolean))].sort()
              : [];

            setDynamicSpecialities(uniqueSpecialties);

            // If currently selected specialty does not exist in this branch, reset it
            if (selectedSpeciality && !uniqueSpecialties.includes(selectedSpeciality)) {
              if (onSpecialityChange) onSpecialityChange('');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load branch specialties:', err);
        if (isMounted) setDynamicSpecialities([]);
      } finally {
        if (isMounted) {
          setIsLoadingSpecialities(false);
        }
      }
    }

    loadSpecialitiesForBranch();

    return () => {
      isMounted = false;
    };
  }, [selectedBranch, specialitiesProp, selectedSpeciality, onSpecialityChange]);

  const resolvedSpecialties = specialitiesProp || dynamicSpecialities;

  const handleSearchClick = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({
        branchId: selectedBranch,
        speciality: selectedSpeciality,
        date: selectedDate,
        doctorName,
      });
    }
  };

  const handleResetClick = () => {
    if (onReset) onReset();
  };

  const hasActiveFilters = Boolean(
    selectedBranch || selectedSpeciality || selectedDate || doctorName
  );

  return (
    <div className="find-form">
      {/* Header */}
      <div className="find-form-header">
        <h2 className="find-form-title">{title}</h2>
        {subtitle && <p className="find-form-subtitle">{subtitle}</p>}
      </div>

      {/* Main filters row */}
      <form onSubmit={handleSearchClick}>
        <div className="find-form-row">

          {/* 1. Branch Dropdown */}
          <div className="find-form-group">
            <label htmlFor="filter-branch">Select Branch</label>
            <select
              id="filter-branch"
              value={selectedBranch}
              onChange={(e) => onBranchChange && onBranchChange(e.target.value)}
              disabled={isLoadingBranches && !branches}
            >
              <option value="">
                {isLoadingBranches && !branches ? 'Loading branches...' : 'All Hospital Branches'}
              </option>
              {activeBranches.map((branch) => {
                const branchName = branch.name || branch.branchName || 'Branch';
                const location = branch.location || branch.city || '';
                return (
                  <option key={branch.id} value={branch.id}>
                    {branchName} {location ? `(${location})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. Speciality Dropdown (Dynamic per branch) */}
          <div className="find-form-group">
            <label htmlFor="filter-speciality">
              <span>Select Speciality</span>
              {selectedBranch && !isLoadingSpecialities && (
                <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: '6px' }}>
                  ({resolvedSpecialties.length} available)
                </span>
              )}
            </label>
            <select
              id="filter-speciality"
              value={selectedSpeciality}
              onChange={(e) => onSpecialityChange && onSpecialityChange(e.target.value)}
              disabled={isLoadingSpecialities && !specialitiesProp}
            >
              <option value="">
                {isLoadingSpecialities && !specialitiesProp
                  ? 'Loading specialties...'
                  : resolvedSpecialties.length === 0
                  ? selectedBranch
                    ? 'No specialties for this branch'
                    : 'No specialties available'
                  : 'All Specialities'}
              </option>
              {resolvedSpecialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Preferred Date Input */}
          <div className="find-form-group">
            <label htmlFor="filter-date">Preferred Date</label>
            <input
              type="date"
              id="filter-date"
              min={getTodayIso()}
              value={selectedDate}
              onChange={(e) => onDateChange && onDateChange(e.target.value)}
            />
          </div>

          {/* 4. Filter Action Buttons */}
          <div className="find-form-actions">
            <button type="submit" className="btn-filter-search">
              <span>🔍</span>
              <span>Search</span>
            </button>
            {hasActiveFilters && onReset && (
              <button
                type="button"
                className="btn-filter-reset"
                onClick={handleResetClick}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Secondary Doctor Name Search Bar */}
        {showDoctorSearch && (
          <div className="find-form-search-row">
            <div className="find-form-search-wrap">
              <span className="find-form-search-icon">🔍</span>
              <input
                type="text"
                className="find-form-search-input"
                placeholder="Search by doctor name (e.g. Dr. Madhuri)..."
                value={doctorName}
                onChange={(e) => onDoctorNameChange && onDoctorNameChange(e.target.value)}
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
