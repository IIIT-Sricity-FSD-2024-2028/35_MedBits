/**
 * branch-statistics.jsx — Super Admin Branch Statistics Page
 * =========================================================================
 * Displays complete team rosters and operational metrics for hospital branches:
 *  - High-level KPI counters (Doctors, Appointments, Front Desk, Lab Techs)
 *  - Hospital branch profile and contact information
 *  - Filterable Doctors registry with specialty and qualifications
 *  - Filterable Front Desk staff table with counters and shift schedules
 *  - Filterable Lab Technician account roster
 *  - Dynamic branch switching via URL search params (?branchId=...) or dropdown
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import './branch-statistics.css';

// Base backend API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Fallback branch list when backend is offline
const MOCK_BRANCHES = [
  {
    id: 'br-blr-01',
    hospitalName: 'MedBits Central (Apollo Wing)',
    branchName: 'Central Bangalore',
    address: '100 Feet Road, Indiranagar',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560038',
    phone: '+91 80 4123 4567',
    email: 'indiranagar@medbits.com',
    status: 'Active',
  },
  {
    id: 'br-blr-02',
    hospitalName: 'MedBits Electronic City',
    branchName: 'Tech Hub Clinic',
    address: 'Phase 1, Hosur Main Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560100',
    phone: '+91 80 9876 5432',
    email: 'electroniccity@medbits.com',
    status: 'Active',
  },
  {
    id: 'br-hyd-01',
    hospitalName: 'MedBits Hitec City',
    branchName: 'Cyber Towers Wing',
    address: 'Madhapur Main Road',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    phone: '+91 40 2345 6789',
    email: 'hiteccity@medbits.com',
    status: 'Active',
  },
];

// Fallback statistics payload for demo/offline preview
const MOCK_STATISTICS = {
  branch: MOCK_BRANCHES[0],
  summary: {
    totalDoctors: 8,
    totalAppointments: 142,
    totalFrontdesks: 4,
    totalLabTechnicians: 3,
  },
  doctors: [
    {
      id: 'doc-1',
      name: 'Dr. Ria Sharma',
      email: 'ria.sharma@medbits.com',
      specialization: 'Cardiology',
      department: 'Cardiology',
      experience: 12,
      phone: '+91 98765 43210',
      gender: 'Female',
      qualification: 'MBBS, MD (Cardiology)',
    },
    {
      id: 'doc-2',
      name: 'Dr. Arvind Swaminathan',
      email: 'arvind.s@medbits.com',
      specialization: 'Neurology',
      department: 'Neurology',
      experience: 15,
      phone: '+91 98450 11223',
      gender: 'Male',
      qualification: 'MBBS, DM (Neurology)',
    },
    {
      id: 'doc-3',
      name: 'Dr. Ananya Roy',
      email: 'ananya.roy@medbits.com',
      specialization: 'Pediatrics',
      department: 'Pediatrics',
      experience: 8,
      phone: '+91 97123 45678',
      gender: 'Female',
      qualification: 'MBBS, DCH',
    },
    {
      id: 'doc-4',
      name: 'Dr. Vikram Patel',
      email: 'vikram.patel@medbits.com',
      specialization: 'Orthopedics',
      department: 'Orthopedics',
      experience: 14,
      phone: '+91 99001 22334',
      gender: 'Male',
      qualification: 'MS (Ortho), MCh',
    },
  ],
  frontdesk: [
    {
      userId: 'fd-1',
      name: 'Pooja Verma',
      email: 'pooja.v@medbits.com',
      counter: 'Desk 1 - Reception',
      shiftStart: '08:00 AM',
      shiftEnd: '04:00 PM',
      languages: ['English', 'Hindi', 'Kannada'],
      phone: '+91 91234 56780',
      gender: 'Female',
      reportingManagerId: 'admin@medbits.com',
    },
    {
      userId: 'fd-2',
      name: 'Karthik Raja',
      email: 'karthik.r@medbits.com',
      counter: 'Desk 2 - Registrations',
      shiftStart: '02:00 PM',
      shiftEnd: '10:00 PM',
      languages: ['English', 'Tamil', 'Telugu'],
      phone: '+91 92345 67891',
      gender: 'Male',
      reportingManagerId: 'admin@medbits.com',
    },
  ],
  labTechnicians: [
    {
      id: 'lt-1',
      name: 'Suresh Kumar',
      email: 'suresh.k@medbits.com',
      branchId: 'br-blr-01',
      createdAt: '2025-01-15T09:30:00.000Z',
    },
    {
      id: 'lt-2',
      name: 'Deepa Nair',
      email: 'deepa.nair@medbits.com',
      branchId: 'br-blr-01',
      createdAt: '2025-02-10T11:00:00.000Z',
    },
  ],
};

export default function BranchStatistics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected branch identifier from query params or state
  const selectedBranchId = searchParams.get('branchId') || '';

  // Data states
  const [branches, setBranches] = useState([]);
  const [branchDetails, setBranchDetails] = useState(null);
  const [summary, setSummary] = useState({
    totalDoctors: 0,
    totalAppointments: 0,
    totalFrontdesks: 0,
    totalLabTechnicians: 0,
  });
  const [doctors, setDoctors] = useState([]);
  const [frontdesk, setFrontdesk] = useState([]);
  const [labTechnicians, setLabTechnicians] = useState([]);

  // Search filter query states for each section
  const [doctorSearch, setDoctorSearch] = useState('');
  const [frontdeskSearch, setFrontdeskSearch] = useState('');
  const [labtechSearch, setLabtechSearch] = useState('');

  // Loading and notification states
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Helper to show temporary toast messages
  const notify = React.useCallback((msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  // Auth header constructor helper
  const getHeaders = React.useCallback(() => {
    return {
      'Content-Type': 'application/json',
      role: user?.role || 'super_admin',
      'x-user-id': user?.id || user?.userId || '',
    };
  }, [user]);

  /* ── 1. Fetch available branches list on mount ──────────────────────── */
  useEffect(() => {
    let isMounted = true;

    async function loadBranchList() {
      try {
        const res = await fetch(`${API_BASE_URL}/super-admin/hospital-branches`, {
          headers: getHeaders(),
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setBranches(data);
            // Default to first branch if none selected in URL
            if (!selectedBranchId) {
              setSearchParams({ branchId: data[0].id });
            }
            return;
          }
        }

        // Try public branch endpoint as secondary fallback
        const pubRes = await fetch(`${API_BASE_URL}/hospital-branches`, {
          headers: getHeaders(),
        }).catch(() => null);

        if (pubRes && pubRes.ok) {
          const pubData = await pubRes.json();
          if (isMounted && Array.isArray(pubData) && pubData.length > 0) {
            setBranches(pubData);
            if (!selectedBranchId) {
              setSearchParams({ branchId: pubData[0].id });
            }
            return;
          }
        }

        // Fallback to mock branches if backend is unreachable
        if (isMounted) {
          setBranches(MOCK_BRANCHES);
          if (!selectedBranchId) {
            setSearchParams({ branchId: MOCK_BRANCHES[0].id });
          }
        }
      } catch (err) {
        console.warn('Could not fetch branches list, using fallback:', err);
        if (isMounted) {
          setBranches(MOCK_BRANCHES);
          if (!selectedBranchId) {
            setSearchParams({ branchId: MOCK_BRANCHES[0].id });
          }
        }
      }
    }

    loadBranchList();
    return () => {
      isMounted = false;
    };
  }, []);

  /* ── 2. Fetch statistics for selected branch ────────────────────────── */
  useEffect(() => {
    let isMounted = true;

    async function fetchStatistics() {
      if (!selectedBranchId) return;

      setIsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/super-admin/hospital-branches/${encodeURIComponent(selectedBranchId)}/statistics`,
          { headers: getHeaders() }
        ).catch(() => null);

        if (res && res.ok) {
          const payload = await res.json();
          if (isMounted) {
            setBranchDetails(payload.branch || null);
            setSummary(
              payload.summary || {
                totalDoctors: payload.doctors?.length || 0,
                totalAppointments: 0,
                totalFrontdesks: payload.frontdesk?.length || 0,
                totalLabTechnicians: payload.labTechnicians?.length || 0,
              }
            );
            setDoctors(Array.isArray(payload.doctors) ? payload.doctors : []);
            setFrontdesk(Array.isArray(payload.frontdesk) ? payload.frontdesk : []);
            setLabTechnicians(
              Array.isArray(payload.labTechnicians) ? payload.labTechnicians : []
            );
            setIsLoading(false);
            return;
          }
        }

        // Graceful fallback to mock data if backend not active
        if (isMounted) {
          const matchedMock =
            MOCK_BRANCHES.find((b) => b.id === selectedBranchId) || MOCK_BRANCHES[0];
          setBranchDetails(matchedMock);
          setSummary(MOCK_STATISTICS.summary);
          setDoctors(MOCK_STATISTICS.doctors);
          setFrontdesk(MOCK_STATISTICS.frontdesk);
          setLabTechnicians(MOCK_STATISTICS.labTechnicians);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Error loading branch statistics, falling back:', err);
        notify('Loaded offline preview data for branch statistics.');
        if (isMounted) {
          setBranchDetails(MOCK_BRANCHES[0]);
          setSummary(MOCK_STATISTICS.summary);
          setDoctors(MOCK_STATISTICS.doctors);
          setFrontdesk(MOCK_STATISTICS.frontdesk);
          setLabTechnicians(MOCK_STATISTICS.labTechnicians);
          setIsLoading(false);
        }
      }
    }

    fetchStatistics();
    return () => {
      isMounted = false;
    };
  }, [selectedBranchId, getHeaders, notify]);

  /* ── 3. Branch selector change handler ──────────────────────────────── */
  function handleBranchChange(e) {
    const newBranchId = e.target.value;
    if (newBranchId) {
      setSearchParams({ branchId: newBranchId });
    }
  }

  /* ── 4. Filtered lists based on search inputs ───────────────────────── */
  // Doctor search filtering
  const filteredDoctors = useMemo(() => {
    const q = doctorSearch.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter((doc) =>
      [
        doc.name,
        doc.email,
        doc.specialization,
        doc.department,
        doc.qualification,
        doc.phone,
        doc.gender,
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q))
    );
  }, [doctors, doctorSearch]);

  // Front desk search filtering
  const filteredFrontdesk = useMemo(() => {
    const q = frontdeskSearch.trim().toLowerCase();
    if (!q) return frontdesk;
    return frontdesk.filter((staff) =>
      [
        staff.name,
        staff.email,
        staff.phone,
        staff.gender,
        staff.counter,
        staff.reportingManagerId,
        Array.isArray(staff.languages) ? staff.languages.join(' ') : '',
        staff.shiftStart,
        staff.shiftEnd,
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q))
    );
  }, [frontdesk, frontdeskSearch]);

  // Lab technician search filtering
  const filteredLabTechs = useMemo(() => {
    const q = labtechSearch.trim().toLowerCase();
    if (!q) return labTechnicians;
    return labTechnicians.filter((tech) =>
      [tech.name, tech.email, tech.branchId]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q))
    );
  }, [labTechnicians, labtechSearch]);

  // Helper date formatter
  function formatDate(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  }

  return (
    <AppShell pageTitle="Branch Statistics">
      <div className="bs-wrapper">

        {/* ── HERO BANNER & BRANCH SELECTOR ──────────────────────────── */}
        <section className="bs-hero">
          <div className="bs-hero-copy">
            <span className="bs-eyebrow">⚡ Super Admin Analytics</span>
            <h1 className="bs-hero-title">
              {branchDetails
                ? `${branchDetails.branchName || 'Branch'} — ${branchDetails.hospitalName || ''}`
                : 'Hospital Branch Statistics'}
            </h1>
            <p className="bs-hero-subtitle">
              <span>📍 {branchDetails?.city || '—'}, {branchDetails?.state || '—'}</span>
              <span>•</span>
              <span>✉️ {branchDetails?.email || 'No email on file'}</span>
            </p>
          </div>

          <div className="bs-hero-actions">
            {/* Branch Switcher Dropdown */}
            <div className="bs-branch-selector-wrap">
              <span className="bs-branch-selector-label">Branch:</span>
              <select
                className="bs-branch-select"
                value={selectedBranchId}
                onChange={handleBranchChange}
                aria-label="Select Hospital Branch"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branchName || b.hospitalName} ({b.city || 'India'})
                  </option>
                ))}
              </select>
            </div>

            {/* Back to Dashboard Button */}
            <button
              type="button"
              className="bs-btn bs-btn-secondary"
              onClick={() => navigate('/superuser/dashboard')}
            >
              ← Back
            </button>
          </div>
        </section>

        {/* ── BRANCH PROFILE SUMMARY PANEL ───────────────────────────── */}
        <section className="bs-card">
          <div className="bs-card-header">
            <div className="bs-card-heading">
              <h2>Branch Profile</h2>
              <p>Basic facility credentials, network status, and contact directory.</p>
            </div>
            {branchDetails?.status && (
              <span
                className={`bs-badge ${
                  String(branchDetails.status).toLowerCase() === 'active'
                    ? 'bs-badge-active'
                    : 'bs-badge-inactive'
                }`}
              >
                {branchDetails.status}
              </span>
            )}
          </div>

          <div className="bs-profile-grid">
            <div className="bs-detail-item">
              <span className="bs-detail-label">Hospital Name</span>
              <span className="bs-detail-val">{branchDetails?.hospitalName || '—'}</span>
            </div>
            <div className="bs-detail-item">
              <span className="bs-detail-label">Branch Name</span>
              <span className="bs-detail-val">{branchDetails?.branchName || '—'}</span>
            </div>
            <div className="bs-detail-item">
              <span className="bs-detail-label">Street Address</span>
              <span className="bs-detail-val">{branchDetails?.address || '—'}</span>
            </div>
            <div className="bs-detail-item">
              <span className="bs-detail-label">City & State</span>
              <span className="bs-detail-val">
                {branchDetails?.city || '—'}, {branchDetails?.state || '—'}
              </span>
            </div>
            <div className="bs-detail-item">
              <span className="bs-detail-label">Postal Pincode</span>
              <span className="bs-detail-val">{branchDetails?.pincode || '—'}</span>
            </div>
            <div className="bs-detail-item">
              <span className="bs-detail-label">Official Phone</span>
              <span className="bs-detail-val">{branchDetails?.phone || '—'}</span>
            </div>
            <div className="bs-detail-item">
              <span className="bs-detail-label">Official Email</span>
              <span className="bs-detail-val">{branchDetails?.email || '—'}</span>
            </div>
            <div className="bs-detail-item">
              <span className="bs-detail-label">Network Status</span>
              <span className="bs-detail-val">{branchDetails?.status || 'Active'}</span>
            </div>
          </div>
        </section>

        {/* ── 4 KPI STAT CARDS ───────────────────────────────────────── */}
        <section className="bs-stats-grid">
          {/* Doctors Count */}
          <div className="bs-stat-card">
            <div className="bs-stat-content">
              <span className="bs-stat-label">Doctors</span>
              <span className="bs-stat-value">{summary.totalDoctors}</span>
              <span className="bs-stat-subtext">Active Practitioners</span>
            </div>
            <div className="bs-stat-icon">🩺</div>
          </div>

          {/* Appointments Count */}
          <div className="bs-stat-card">
            <div className="bs-stat-content">
              <span className="bs-stat-label">Appointments</span>
              <span className="bs-stat-value">{summary.totalAppointments}</span>
              <span className="bs-stat-subtext">Total Scheduled</span>
            </div>
            <div className="bs-stat-icon">📅</div>
          </div>

          {/* Front Desk Count */}
          <div className="bs-stat-card">
            <div className="bs-stat-content">
              <span className="bs-stat-label">Front Desks</span>
              <span className="bs-stat-value">{summary.totalFrontdesks}</span>
              <span className="bs-stat-subtext">Duty Staff</span>
            </div>
            <div className="bs-stat-icon">🖥️</div>
          </div>

          {/* Lab Technicians Count */}
          <div className="bs-stat-card">
            <div className="bs-stat-content">
              <span className="bs-stat-label">Lab Techs</span>
              <span className="bs-stat-value">{summary.totalLabTechnicians}</span>
              <span className="bs-stat-subtext">Diagnostics Team</span>
            </div>
            <div className="bs-stat-icon">🔬</div>
          </div>
        </section>

        {/* ── DOCTORS TABLE PANEL ────────────────────────────────────── */}
        <section className="bs-card">
          <div className="bs-card-header">
            <div className="bs-card-heading">
              <h2>Doctors ({filteredDoctors.length})</h2>
              <p>Doctor profiles attached and actively consulting at this branch.</p>
            </div>
            <div className="bs-search-box">
              <span className="bs-search-icon">🔍</span>
              <input
                type="search"
                className="bs-search-input"
                placeholder="Search doctors..."
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                aria-label="Search doctors"
              />
            </div>
          </div>

          <div className="bs-table-shell">
            <table className="bs-table">
              <thead>
                <tr>
                  <th>Doctor Name & Email</th>
                  <th>Specialization</th>
                  <th>Department</th>
                  <th>Experience</th>
                  <th>Contact</th>
                  <th>Qualification</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="bs-empty-state">
                      <div className="bs-spinner" style={{ margin: '0 auto 8px' }} />
                      Loading doctors...
                    </td>
                  </tr>
                ) : filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="bs-empty-state">
                      No doctors found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doc, idx) => (
                    <tr key={doc.id || doc.userId || idx}>
                      <td>
                        <div className="bs-name-cell">
                          <span className="bs-name-title">{doc.name}</span>
                          <span className="bs-name-subtitle">{doc.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className="bs-badge bs-badge-dept">
                          {doc.specialization || 'General'}
                        </span>
                      </td>
                      <td>{doc.department || '—'}</td>
                      <td>{doc.experience != null ? `${doc.experience} yrs` : '—'}</td>
                      <td>
                        <div>{doc.phone || '—'}</div>
                        <div className="bs-name-subtitle">{doc.gender || ''}</div>
                      </td>
                      <td>{doc.qualification || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── FRONT DESK TABLE PANEL ─────────────────────────────────── */}
        <section className="bs-card">
          <div className="bs-card-header">
            <div className="bs-card-heading">
              <h2>Front Desk Staff ({filteredFrontdesk.length})</h2>
              <p>Receptionist counter assignments and operational shifts.</p>
            </div>
            <div className="bs-search-box">
              <span className="bs-search-icon">🔍</span>
              <input
                type="search"
                className="bs-search-input"
                placeholder="Search front desk staff..."
                value={frontdeskSearch}
                onChange={(e) => setFrontdeskSearch(e.target.value)}
                aria-label="Search front desk staff"
              />
            </div>
          </div>

          <div className="bs-table-shell">
            <table className="bs-table">
              <thead>
                <tr>
                  <th>Staff Name & Email</th>
                  <th>Counter</th>
                  <th>Shift Schedule</th>
                  <th>Languages</th>
                  <th>Contact</th>
                  <th>Manager</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="bs-empty-state">
                      Loading front desk roster...
                    </td>
                  </tr>
                ) : filteredFrontdesk.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="bs-empty-state">
                      No front desk staff found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredFrontdesk.map((staff, idx) => {
                    const shift =
                      staff.shiftStart && staff.shiftEnd
                        ? `${staff.shiftStart} - ${staff.shiftEnd}`
                        : '—';
                    const langs =
                      Array.isArray(staff.languages) && staff.languages.length > 0
                        ? staff.languages.join(', ')
                        : '—';

                    return (
                      <tr key={staff.userId || idx}>
                        <td>
                          <div className="bs-name-cell">
                            <span className="bs-name-title">{staff.name}</span>
                            <span className="bs-name-subtitle">{staff.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className="bs-badge bs-badge-tag">
                            {staff.counter || 'Unassigned'}
                          </span>
                        </td>
                        <td>{shift}</td>
                        <td>{langs}</td>
                        <td>
                          <div>{staff.phone || '—'}</div>
                          <div className="bs-name-subtitle">{staff.gender || ''}</div>
                        </td>
                        <td>{staff.reportingManagerId || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── LAB TECHNICIANS TABLE PANEL ────────────────────────────── */}
        <section className="bs-card">
          <div className="bs-card-header">
            <div className="bs-card-heading">
              <h2>Lab Technicians ({filteredLabTechs.length})</h2>
              <p>Diagnostics personnel assigned to this hospital branch.</p>
            </div>
            <div className="bs-search-box">
              <span className="bs-search-icon">🔍</span>
              <input
                type="search"
                className="bs-search-input"
                placeholder="Search lab technicians..."
                value={labtechSearch}
                onChange={(e) => setLabtechSearch(e.target.value)}
                aria-label="Search lab technicians"
              />
            </div>
          </div>

          <div className="bs-table-shell">
            <table className="bs-table">
              <thead>
                <tr>
                  <th>Technician Name</th>
                  <th>Email</th>
                  <th>Branch Assigned</th>
                  <th>Registered On</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="bs-empty-state">
                      Loading diagnostics technicians...
                    </td>
                  </tr>
                ) : filteredLabTechs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="bs-empty-state">
                      No lab technicians found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredLabTechs.map((tech, idx) => (
                    <tr key={tech.id || idx}>
                      <td>
                        <div className="bs-name-cell">
                          <span className="bs-name-title">{tech.name}</span>
                          <span className="bs-name-subtitle">Lab Technician</span>
                        </div>
                      </td>
                      <td>{tech.email}</td>
                      <td>
                        <span className="bs-badge bs-badge-tag">
                          {tech.branchId || branchDetails?.branchName || '—'}
                        </span>
                      </td>
                      <td>{formatDate(tech.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── NOTIFICATION TOAST ─────────────────────────────────────── */}
        {toastMessage && (
          <div
            className={`bs-toast ${toastMessage.isError ? 'bs-toast-error' : ''}`}
            role="status"
          >
            {toastMessage.text}
          </div>
        )}

      </div>
    </AppShell>
  );
}
