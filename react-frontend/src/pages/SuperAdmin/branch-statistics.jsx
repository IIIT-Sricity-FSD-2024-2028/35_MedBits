/**
 * branch-statistics.jsx — Super Admin Branch Statistics Page
 * =========================================================================
 * Clean, readable React component for inspecting hospital branch personnel & operations:
 *  - High-level KPI counters (Doctors, Appointments, Front Desk, Lab Techs)
 *  - Branch profile credentials, network status, and contact directory
 *  - Filterable Doctors registry with specialty and qualifications
 *  - Filterable Front Desk staff table with counters and shifts
 *  - Filterable Lab Technician diagnostic team roster
 *  - Branch switcher synchronized via URL search params (?branchId=...)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import './branch-statistics.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Fallback demo branches for offline preview
const DEFAULT_BRANCHES = [
  { id: 'br-blr-01', branchName: 'Central Bangalore', hospitalName: 'MedBits Central (Apollo Wing)', city: 'Bangalore', state: 'Karnataka', email: 'indiranagar@medbits.com', phone: '+91 80 4123 4567', address: '100 Feet Road, Indiranagar', pincode: '560038', status: 'Active' },
  { id: 'br-blr-02', branchName: 'Tech Hub Clinic', hospitalName: 'MedBits Electronic City', city: 'Bangalore', state: 'Karnataka', email: 'electroniccity@medbits.com', phone: '+91 80 9876 5432', address: 'Phase 1, Hosur Main Road', pincode: '560100', status: 'Active' },
  { id: 'br-hyd-01', branchName: 'Cyber Towers Wing', hospitalName: 'MedBits Hitec City', city: 'Hyderabad', state: 'Telangana', email: 'hiteccity@medbits.com', phone: '+91 40 2345 6789', address: 'Madhapur Main Road', pincode: '500081', status: 'Active' },
];

export default function BranchStatistics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active branch ID from URL search parameters (?branchId=...)
  const selectedBranchId = searchParams.get('branchId') || '';

  // Data states
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState({
    branch: null,
    summary: { totalDoctors: 0, totalAppointments: 0, totalFrontdesks: 0, totalLabTechnicians: 0 },
    doctors: [],
    frontdesk: [],
    labTechnicians: [],
  });

  // Search filter query states
  const [docSearch, setDocSearch] = useState('');
  const [fdSearch, setFdSearch] = useState('');
  const [ltSearch, setLtSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Common authentication headers
  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    role: user?.role || 'super_admin',
    'x-user-id': user?.id || user?.userId || '',
  }), [user]);

  // 1. Fetch branches list on mount
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await fetch(`${API_BASE_URL}/super-admin/hospital-branches`, {
          headers: authHeaders,
        }).catch(() => null);

        if (res?.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setBranches(list);
            if (!selectedBranchId) setSearchParams({ branchId: list[0].id });
            return;
          }
        }
        // Fallback demo branches
        setBranches(DEFAULT_BRANCHES);
        if (!selectedBranchId) setSearchParams({ branchId: DEFAULT_BRANCHES[0].id });
      } catch (err) {
        console.warn('Error loading branches list:', err);
        setBranches(DEFAULT_BRANCHES);
        if (!selectedBranchId) setSearchParams({ branchId: DEFAULT_BRANCHES[0].id });
      }
    }

    loadBranches();
  }, [authHeaders, selectedBranchId, setSearchParams]);

  // 2. Fetch statistics for the selected branch
  useEffect(() => {
    if (!selectedBranchId) return;

    async function loadStatistics() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/super-admin/hospital-branches/${encodeURIComponent(selectedBranchId)}/statistics`,
          { headers: authHeaders }
        ).catch(() => null);

        if (res?.ok) {
          const data = await res.json();
          setStats({
            branch: data.branch || branches.find((b) => b.id === selectedBranchId) || null,
            summary: data.summary || {
              totalDoctors: data.doctors?.length || 0,
              totalAppointments: 0,
              totalFrontdesks: data.frontdesk?.length || 0,
              totalLabTechnicians: data.labTechnicians?.length || 0,
            },
            doctors: Array.isArray(data.doctors) ? data.doctors : [],
            frontdesk: Array.isArray(data.frontdesk) ? data.frontdesk : [],
            labTechnicians: Array.isArray(data.labTechnicians) ? data.labTechnicians : [],
          });
          setIsLoading(false);
          return;
        }

        // Fallback default statistics when backend offline
        const matched = branches.find((b) => b.id === selectedBranchId) || DEFAULT_BRANCHES[0];
        setStats({
          branch: matched,
          summary: { totalDoctors: 4, totalAppointments: 86, totalFrontdesks: 2, totalLabTechnicians: 2 },
          doctors: [
            { id: 'd-1', name: 'Dr. Ria Sharma', email: 'ria.sharma@medbits.com', specialization: 'Cardiology', department: 'Cardiology', experience: 12, phone: '+91 98765 43210', gender: 'Female', qualification: 'MBBS, MD' },
            { id: 'd-2', name: 'Dr. Arvind Swaminathan', email: 'arvind.s@medbits.com', specialization: 'Neurology', department: 'Neurology', experience: 15, phone: '+91 98450 11223', gender: 'Male', qualification: 'MBBS, DM' },
          ],
          frontdesk: [
            { userId: 'fd-1', name: 'Pooja Verma', email: 'pooja.v@medbits.com', counter: 'Desk 1 - Reception', shiftStart: '08:00 AM', shiftEnd: '04:00 PM', languages: ['English', 'Hindi'], phone: '+91 91234 56780', gender: 'Female', reportingManagerId: 'admin@medbits.com' },
          ],
          labTechnicians: [
            { id: 'lt-1', name: 'Suresh Kumar', email: 'suresh.k@medbits.com', branchId: selectedBranchId, createdAt: '2025-01-15T09:30:00.000Z' },
          ],
        });
      } catch (err) {
        console.warn('Error loading branch stats:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStatistics();
  }, [selectedBranchId, authHeaders, branches]);

  // Handle switching branch from dropdown
  const handleBranchChange = (e) => {
    setSearchParams({ branchId: e.target.value });
  };

  // Filtered lists based on search queries
  const filteredDoctors = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    if (!q) return stats.doctors;
    return stats.doctors.filter((d) =>
      [d.name, d.email, d.specialization, d.department, d.qualification].some(
        (v) => v && String(v).toLowerCase().includes(q)
      )
    );
  }, [stats.doctors, docSearch]);

  const filteredFrontdesk = useMemo(() => {
    const q = fdSearch.trim().toLowerCase();
    if (!q) return stats.frontdesk;
    return stats.frontdesk.filter((f) =>
      [f.name, f.email, f.counter, f.phone].some(
        (v) => v && String(v).toLowerCase().includes(q)
      )
    );
  }, [stats.frontdesk, fdSearch]);

  const filteredLabTechs = useMemo(() => {
    const q = ltSearch.trim().toLowerCase();
    if (!q) return stats.labTechnicians;
    return stats.labTechnicians.filter((l) =>
      [l.name, l.email, l.branchId].some(
        (v) => v && String(v).toLowerCase().includes(q)
      )
    );
  }, [stats.labTechnicians, ltSearch]);

  // Helper date formatter
  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  };

  const branch = stats.branch || {};
  const summary = stats.summary;

  return (
    <AppShell pageTitle="Branch Statistics">
      <div className="bs-wrapper">

        {/* ── 1. HERO BANNER & BRANCH SELECTOR ── */}
        <section className="bs-hero">
          <div className="bs-hero-copy">
            <span className="bs-eyebrow">⚡ Super Admin Analytics</span>
            <h1 className="bs-hero-title">
              {branch.branchName ? `${branch.branchName} — ${branch.hospitalName || ''}` : 'Hospital Branch Statistics'}
            </h1>
            <p className="bs-hero-subtitle">
              <span>📍 {branch.city || '—'}, {branch.state || '—'}</span>
              <span>•</span>
              <span>✉️ {branch.email || 'No email on file'}</span>
            </p>
          </div>

          <div className="bs-hero-actions">
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

            <button
              type="button"
              className="bs-btn bs-btn-secondary"
              onClick={() => navigate('/superuser/dashboard')}
            >
              ← Back
            </button>
          </div>
        </section>

        {/* ── 2. BRANCH PROFILE SUMMARY ── */}
        <section className="bs-card">
          <div className="bs-card-header">
            <div className="bs-card-heading">
              <h2>Branch Profile</h2>
              <p>Basic facility credentials, network status, and contact directory.</p>
            </div>
            {branch.status && (
              <span className={`bs-badge ${String(branch.status).toLowerCase() === 'active' ? 'bs-badge-active' : 'bs-badge-inactive'}`}>
                {branch.status}
              </span>
            )}
          </div>

          <div className="bs-profile-grid">
            <div className="bs-detail-item">
              <span className="bs-detail-label">Hospital Name</span>
              <span className="bs-detail-val">{branch.hospitalName || '—'}</span>
            </div>
            <div className="bs-detail-item">
              <span className="bs-detail-label">Branch Name</span>
              <span className="bs-detail-val">{branch.branchName || '—'}</span>
            </div>
            <div className="bs-detail-item">
              <span className="bs-detail-label">Street Address</span>
              <span className="bs-detail-val">{branch.address || '—'}</span>
            </div>
            <div className="bs-detail-item">
              <span className="bs-detail-label">City & State</span>
              <span className="bs-detail-val">{branch.city || '—'}, {branch.state || '—'}</span>
            </div>
            <div className="bs-detail-item">
              <span className="bs-detail-label">Postal Pincode</span>
              <span className="bs-detail-val">{branch.pincode || '—'}</span>
            </div>
            <div className="bs-detail-item">
              <span className="bs-detail-label">Official Phone</span>
              <span className="bs-detail-val">{branch.phone || '—'}</span>
            </div>
            <div className="bs-detail-item">
              <span className="bs-detail-label">Official Email</span>
              <span className="bs-detail-val">{branch.email || '—'}</span>
            </div>
            <div className="bs-detail-item">
              <span className="bs-detail-label">Network Status</span>
              <span className="bs-detail-val">{branch.status || 'Active'}</span>
            </div>
          </div>
        </section>

        {/* ── 3. 4 KPI STAT CARDS ── */}
        <section className="bs-stats-grid">
          <div className="bs-stat-card">
            <div className="bs-stat-content">
              <span className="bs-stat-label">Doctors</span>
              <span className="bs-stat-value">{summary.totalDoctors}</span>
              <span className="bs-stat-subtext">Active Practitioners</span>
            </div>
            <div className="bs-stat-icon">🩺</div>
          </div>

          <div className="bs-stat-card">
            <div className="bs-stat-content">
              <span className="bs-stat-label">Appointments</span>
              <span className="bs-stat-value">{summary.totalAppointments}</span>
              <span className="bs-stat-subtext">Total Scheduled</span>
            </div>
            <div className="bs-stat-icon">📅</div>
          </div>

          <div className="bs-stat-card">
            <div className="bs-stat-content">
              <span className="bs-stat-label">Front Desks</span>
              <span className="bs-stat-value">{summary.totalFrontdesks}</span>
              <span className="bs-stat-subtext">Duty Staff</span>
            </div>
            <div className="bs-stat-icon">🖥️</div>
          </div>

          <div className="bs-stat-card">
            <div className="bs-stat-content">
              <span className="bs-stat-label">Lab Techs</span>
              <span className="bs-stat-value">{summary.totalLabTechnicians}</span>
              <span className="bs-stat-subtext">Diagnostics Team</span>
            </div>
            <div className="bs-stat-icon">🔬</div>
          </div>
        </section>

        {/* ── 4. DOCTORS ROSTER TABLE ── */}
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
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
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
                  <tr><td colSpan="6" className="bs-empty-state">Loading doctors...</td></tr>
                ) : filteredDoctors.length === 0 ? (
                  <tr><td colSpan="6" className="bs-empty-state">No doctors found matching query.</td></tr>
                ) : (
                  filteredDoctors.map((doc, idx) => (
                    <tr key={doc.id || idx}>
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

        {/* ── 5. FRONT DESK ROSTER TABLE ── */}
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
                placeholder="Search front desk..."
                value={fdSearch}
                onChange={(e) => setFdSearch(e.target.value)}
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
                  <tr><td colSpan="6" className="bs-empty-state">Loading staff...</td></tr>
                ) : filteredFrontdesk.length === 0 ? (
                  <tr><td colSpan="6" className="bs-empty-state">No front desk staff found matching query.</td></tr>
                ) : (
                  filteredFrontdesk.map((staff, idx) => (
                    <tr key={staff.userId || idx}>
                      <td>
                        <div className="bs-name-cell">
                          <span className="bs-name-title">{staff.name}</span>
                          <span className="bs-name-subtitle">{staff.email}</span>
                        </div>
                      </td>
                      <td><span className="bs-badge bs-badge-tag">{staff.counter || 'Unassigned'}</span></td>
                      <td>{staff.shiftStart && staff.shiftEnd ? `${staff.shiftStart} - ${staff.shiftEnd}` : '—'}</td>
                      <td>{Array.isArray(staff.languages) ? staff.languages.join(', ') : '—'}</td>
                      <td>
                        <div>{staff.phone || '—'}</div>
                        <div className="bs-name-subtitle">{staff.gender || ''}</div>
                      </td>
                      <td>{staff.reportingManagerId || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 6. LAB TECHNICIANS ROSTER TABLE ── */}
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
                value={ltSearch}
                onChange={(e) => setLtSearch(e.target.value)}
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
                  <tr><td colSpan="4" className="bs-empty-state">Loading technicians...</td></tr>
                ) : filteredLabTechs.length === 0 ? (
                  <tr><td colSpan="4" className="bs-empty-state">No lab technicians found matching query.</td></tr>
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
                      <td><span className="bs-badge bs-badge-tag">{tech.branchId || branch.branchName || '—'}</span></td>
                      <td>{formatDate(tech.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </AppShell>
  );
}
