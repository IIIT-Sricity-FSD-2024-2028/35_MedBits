/**
 * ManageDoctors.jsx — Branch Admin Manage Doctors Page
 * =========================================================================
 * Clean, simplified doctor management for Branch Admins:
 *  - Metric cards: Total Doctors, Specializations, Avg Experience
 *  - Real-time search & Department dropdown filter
 *  - Interactive Doctors table with avatar, fee, cut, phone
 *  - Create & Edit Doctor via DoctorFormModal
 *  - Doctor Profile & Appointments view modal
 *  - Doctor soft-delete with confirmation modal
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import ContentCard from '../../components/dashboard/ContentCard';
import Modal from '../../components/common/Modal';
import DoctorFormModal from '../../components/branch-admin/DoctorFormModal';
import { API_BASE_URL, getAuthHeaders } from '../../components/branch-admin/staffHelpers';
import './ManageDoctors.css';

function getInitials(name = '') {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function ManageDoctors() {
  const { user } = useAuth();

  // Data & Filter State
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [viewDoctor, setViewDoctor] = useState(null);
  const [doctorAppts, setDoctorAppts] = useState([]);
  const [isLoadingAppts, setIsLoadingAppts] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch doctors on mount
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const branchParam = user?.branchId ? `?branchId=${encodeURIComponent(user.branchId)}` : '';
        const res = await fetch(`${API_BASE_URL}/doctors${branchParam}`, {
          headers: getAuthHeaders(user),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) setDoctors(Array.isArray(data) ? data : []);
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (err) {
        if (isMounted) {
          setAlert({ type: 'error', message: err.message || 'Failed to load doctors.' });
          setDoctors([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // 2. Reload doctors after create, edit, or delete
  const reloadDoctors = async () => {
    setIsLoading(true);
    try {
      const branchParam = user?.branchId ? `?branchId=${encodeURIComponent(user.branchId)}` : '';
      const res = await fetch(`${API_BASE_URL}/doctors${branchParam}`, {
        headers: getAuthHeaders(user),
      });
      if (res.ok) {
        const data = await res.json();
        setDoctors(Array.isArray(data) ? data : []);
      }
    } catch {
      // Keep existing list on error
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Open view modal and load appointments for selected doctor
  const handleOpenViewModal = async (doc) => {
    setViewDoctor(doc);
    setDoctorAppts([]);
    setIsLoadingAppts(true);

    try {
      const docId = doc.userId || doc.id;
      const res = await fetch(`${API_BASE_URL}/appointments/doctor/${encodeURIComponent(docId)}`, {
        headers: getAuthHeaders(user),
      });

      if (res.ok) {
        const appts = await res.json();
        setDoctorAppts(Array.isArray(appts) ? appts : []);
      }
    } catch {
      setDoctorAppts([]);
    } finally {
      setIsLoadingAppts(false);
    }
  };

  // 4. Handle doctor delete
  const handleDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    setIsDeleting(true);

    try {
      const docId = doctorToDelete.userId || doctorToDelete.id;
      const res = await fetch(`${API_BASE_URL}/doctors/${encodeURIComponent(docId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(user),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Failed to remove doctor');
      }

      setAlert({ type: 'success', message: `${doctorToDelete.name || 'Doctor'} removed successfully.` });
      setDoctorToDelete(null);
      await reloadDoctors();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete doctor.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── SIMPLE DERIVED DATA (No useMemo needed for lightweight computations) ──
  const totalDoctors = doctors.length;
  const uniqueSpecs = new Set(doctors.map((d) => d.specialization).filter(Boolean)).size;
  const expYears = doctors.map((d) => Number(d.experience)).filter((n) => !isNaN(n) && n > 0);
  const avgExperience = expYears.length
    ? (expYears.reduce((a, b) => a + b, 0) / expYears.length).toFixed(1)
    : '—';

  const departments = [...new Set(doctors.map((d) => d.department).filter(Boolean))].sort();

  const query = searchQuery.trim().toLowerCase();
  const filteredDoctors = doctors.filter((doc) => {
    const matchSearch =
      !query ||
      (doc.name || '').toLowerCase().includes(query) ||
      (doc.specialization || '').toLowerCase().includes(query) ||
      (doc.email || '').toLowerCase().includes(query);

    const matchDept = !selectedDept || doc.department === selectedDept;
    return matchSearch && matchDept;
  });

  // Appointment status counts for view modal
  const apptCompleted = doctorAppts.filter((a) => ['completed', 'done'].includes(String(a.status).toLowerCase())).length;
  const apptPending = doctorAppts.filter((a) => String(a.status).toLowerCase() === 'pending').length;
  const apptAccepted = doctorAppts.filter((a) => String(a.status).toLowerCase() === 'accepted').length;
  const apptUpcoming = doctorAppts.filter((a) => String(a.status).toLowerCase() === 'upcoming').length;
  const apptCancelled = doctorAppts.filter((a) => ['rejected', 'cancelled'].includes(String(a.status).toLowerCase())).length;

  return (
    <AppShell pageTitle="Manage Doctors">
      <div className="manage-doctors-page">

        {/* ── TOP ALERT BANNER ────────────────────────────────────────────── */}
        {alert && (
          <div
            className={`staff-modal-alert ${alert.type}`}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{alert.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{alert.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlert(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'inherit' }}
            >
              ×
            </button>
          </div>
        )}

        {/* ── 1. PAGE HEADER ──────────────────────────────────────────────── */}
        <div className="doc-page-header">
          <div>
            <h1 className="doc-page-h1">Manage Doctors</h1>
            <p className="doc-page-sub">Add, edit, and view doctors assigned to your branch</p>
          </div>
          <button
            type="button"
            className="doc-add-btn"
            onClick={() => {
              setEditingDoctor(null);
              setIsFormOpen(true);
            }}
          >
            <span>＋</span>
            <span>Add Doctor</span>
          </button>
        </div>

        {/* ── 2. SEARCH & DEPT FILTER ─────────────────────────────────────── */}
        <div className="doc-filter-bar">
          <div className="doc-search-wrap">
            <span className="doc-search-icon">🔍</span>
            <input
              type="text"
              className="doc-search-input"
              placeholder="Search by name or specialization…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="doc-dept-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* ── 3. METRIC STAT CARDS ────────────────────────────────────────── */}
        <div className="doc-stat-grid">
          <div className="doc-stat-card">
            <span className="doc-stat-label">Total Doctors</span>
            <span className="doc-stat-val">{totalDoctors}</span>
            <span className="doc-stat-sub">Assigned to this branch</span>
          </div>

          <div className="doc-stat-card">
            <span className="doc-stat-label">Specializations</span>
            <span className="doc-stat-val">{uniqueSpecs}</span>
            <span className="doc-stat-sub">Clinical disciplines</span>
          </div>

          <div className="doc-stat-card">
            <span className="doc-stat-label">Avg. Experience</span>
            <span className="doc-stat-val">{avgExperience}</span>
            <span className="doc-stat-sub">Years across consultants</span>
          </div>
        </div>

        {/* ── 4. DOCTORS DATA TABLE ───────────────────────────────────────── */}
        <ContentCard
          title="Doctors List"
          subtitle={`Showing ${filteredDoctors.length} of ${doctors.length} doctors`}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              Loading doctors…
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🩺</div>
              <p style={{ fontWeight: 600, color: 'var(--navy)' }}>No doctors found</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>
                {doctors.length === 0
                  ? 'Get started by adding the first doctor to your branch.'
                  : 'Try adjusting your search query or department filter.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="doc-appts-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Specialization</th>
                    <th>Department</th>
                    <th>Experience</th>
                    <th>Fee</th>
                    <th>Cut (%)</th>
                    <th>Phone</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.map((doc) => {
                    const docId = doc.userId || doc.id || '';
                    return (
                      <tr key={docId}>
                        <td>
                          <div
                            className="doc-name-cell"
                            onClick={() => handleOpenViewModal(doc)}
                            title="Click to view doctor profile and appointments"
                          >
                            <div className="doc-avatar">{getInitials(doc.name)}</div>
                            <div>
                              <div className="doc-name-title">{doc.name || '—'}</div>
                              <div className="doc-name-email">{doc.email || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="doc-spec-badge">{doc.specialization || '—'}</span>
                        </td>
                        <td>{doc.department || '—'}</td>
                        <td>{doc.experience != null ? `${doc.experience} yrs` : '—'}</td>
                        <td>{doc.consultationFee != null ? `₹${doc.consultationFee}` : '—'}</td>
                        <td>{doc.percentageCut != null ? `${doc.percentageCut}%` : '—'}</td>
                        <td>{doc.phone || '—'}</td>
                        <td>
                          <div className="doc-actions-cell" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="doc-btn-view"
                              onClick={() => handleOpenViewModal(doc)}
                              title="View Full Profile & Appointments"
                            >
                              👁 View
                            </button>
                            <button
                              type="button"
                              className="doc-btn-icon"
                              onClick={() => {
                                setEditingDoctor(doc);
                                setIsFormOpen(true);
                              }}
                              title="Edit Doctor"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="doc-btn-icon delete"
                              onClick={() => setDoctorToDelete(doc)}
                              title="Remove Doctor"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ContentCard>

        {/* ── 5. REUSABLE CREATE / EDIT DOCTOR MODAL ───────────────────────── */}
        <DoctorFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingDoctor(null);
          }}
          initialData={editingDoctor}
          onSuccess={(savedDoc) => {
            setAlert({
              type: 'success',
              message: `${savedDoc?.name || editingDoctor?.name || 'Doctor'} saved successfully!`,
            });
            reloadDoctors();
          }}
        />

        {/* ── 6. VIEW DOCTOR DETAILS MODAL ─────────────────────────────────── */}
        {viewDoctor && (
          <Modal
            isOpen={Boolean(viewDoctor)}
            onClose={() => setViewDoctor(null)}
            title="🩺 Doctor Profile & Appointments"
            subtitle="Detailed consultation history, doctor credentials, and schedule"
            maxWidth="680px"
            footer={
              <>
                <button
                  type="button"
                  className="staff-footer-btn staff-footer-btn-outline"
                  onClick={() => setViewDoctor(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="staff-footer-btn staff-footer-btn-primary"
                  onClick={() => {
                    const doc = viewDoctor;
                    setViewDoctor(null);
                    setEditingDoctor(doc);
                    setIsFormOpen(true);
                  }}
                >
                  ✏️ Edit Doctor
                </button>
              </>
            }
          >
            <div>
              {/* Profile Card Header */}
              <div className="doc-view-header">
                <div className="doc-view-avatar">{getInitials(viewDoctor.name)}</div>
                <div>
                  <div className="doc-view-name">{viewDoctor.name || '—'}</div>
                  <div className="doc-view-meta">
                    {viewDoctor.specialization} {viewDoctor.department ? `· ${viewDoctor.department}` : ''}
                    {' · '}
                    <span className="doc-spec-badge" style={{ fontSize: '11px', padding: '2px 8px' }}>
                      {viewDoctor.userId || viewDoctor.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="doc-divider" />

              {/* Personal & Professional Info */}
              <div className="doc-section-h2">Personal & Professional Credentials</div>
              <div className="doc-details-grid">
                <div className="doc-detail-item">
                  <span className="doc-detail-label">Email</span>
                  <span className="doc-detail-val">{viewDoctor.email || '—'}</span>
                </div>
                <div className="doc-detail-item">
                  <span className="doc-detail-label">Phone</span>
                  <span className="doc-detail-val">{viewDoctor.phone || '—'}</span>
                </div>
                <div className="doc-detail-item">
                  <span className="doc-detail-label">Gender</span>
                  <span className="doc-detail-val">{viewDoctor.gender || '—'}</span>
                </div>
                <div className="doc-detail-item">
                  <span className="doc-detail-label">Age</span>
                  <span className="doc-detail-val">{viewDoctor.age ? `${viewDoctor.age} years` : '—'}</span>
                </div>
                <div className="doc-detail-item">
                  <span className="doc-detail-label">Qualification</span>
                  <span className="doc-detail-val">{viewDoctor.qualification || '—'}</span>
                </div>
                <div className="doc-detail-item">
                  <span className="doc-detail-label">Experience</span>
                  <span className="doc-detail-val">{viewDoctor.experience != null ? `${viewDoctor.experience} years` : '—'}</span>
                </div>
                <div className="doc-detail-item">
                  <span className="doc-detail-label">Consultation Fee</span>
                  <span className="doc-detail-val">{viewDoctor.consultationFee != null ? `₹${viewDoctor.consultationFee}` : '—'}</span>
                </div>
                <div className="doc-detail-item">
                  <span className="doc-detail-label">Doctor Cut (%)</span>
                  <span className="doc-detail-val">{viewDoctor.percentageCut != null ? `${viewDoctor.percentageCut}%` : '—'}</span>
                </div>
                <div className="doc-detail-item">
                  <span className="doc-detail-label">License No.</span>
                  <span className="doc-detail-val">{viewDoctor.licenseNo || '—'}</span>
                </div>
                <div className="doc-detail-item">
                  <span className="doc-detail-label">Branch ID</span>
                  <span className="doc-detail-val" style={{ fontSize: '12px' }}>{viewDoctor.branchId || '—'}</span>
                </div>

                {viewDoctor.bio && (
                  <div className="doc-detail-item full">
                    <span className="doc-detail-label">Biography</span>
                    <span className="doc-detail-val" style={{ lineHeight: 1.5 }}>{viewDoctor.bio}</span>
                  </div>
                )}

                {Array.isArray(viewDoctor.slots) && viewDoctor.slots.length > 0 && (
                  <div className="doc-detail-item full">
                    <span className="doc-detail-label">Available OPD Slots</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      {viewDoctor.slots.map((s) => (
                        <span key={s} className="staff-tag-chip" style={{ fontSize: '11px' }}>
                          ⏱ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="doc-divider" />

              {/* Appointments Overview */}
              <div className="doc-appt-summary-bar">
                <div className="doc-section-h2" style={{ margin: 0 }}>Appointments Overview</div>
                <div className="doc-pills-row">
                  <span className="doc-pill teal">Total: {doctorAppts.length}</span>
                  {apptCompleted > 0 && <span className="doc-pill green">Completed: {apptCompleted}</span>}
                  {apptPending > 0 && <span className="doc-pill orange">Pending: {apptPending}</span>}
                  {apptAccepted > 0 && <span className="doc-pill teal">Accepted: {apptAccepted}</span>}
                  {apptUpcoming > 0 && <span className="doc-pill blue">Upcoming: {apptUpcoming}</span>}
                  {apptCancelled > 0 && <span className="doc-pill red">Cancelled: {apptCancelled}</span>}
                </div>
              </div>

              {/* Appointments Table */}
              <div className="doc-appts-table-wrap">
                {isLoadingAppts ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '16px' }}>
                    Loading appointments…
                  </p>
                ) : doctorAppts.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '16px' }}>
                    No appointments scheduled for this doctor.
                  </p>
                ) : (
                  <table className="doc-appts-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Patient</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctorAppts.map((appt) => {
                        const patientName = appt.patient?.name || appt.userId || 'Patient';
                        const patientPhone = appt.patient?.phone || '';
                        const st = String(appt.status || 'upcoming').toLowerCase();

                        let pillClass = 'teal';
                        let statusText = 'Upcoming';
                        if (['completed', 'done'].includes(st)) {
                          pillClass = 'green';
                          statusText = 'Completed';
                        } else if (st === 'pending') {
                          pillClass = 'orange';
                          statusText = 'Pending';
                        } else if (['rejected', 'cancelled'].includes(st)) {
                          pillClass = 'red';
                          statusText = 'Cancelled';
                        } else if (st === 'upcoming') {
                          pillClass = 'blue';
                          statusText = 'Upcoming';
                        }

                        return (
                          <tr key={appt.id || `${appt.date}-${appt.slot}`}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{formatDate(appt.date)}</div>
                              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{appt.slot || '—'}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{patientName}</div>
                              {patientPhone && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{patientPhone}</div>
                              )}
                            </td>
                            <td>
                              <span className={`doc-pill ${pillClass}`}>{statusText}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* ── 7. DELETE CONFIRMATION MODAL ─────────────────────────────────── */}
        {doctorToDelete && (
          <Modal
            isOpen={Boolean(doctorToDelete)}
            onClose={() => setDoctorToDelete(null)}
            title="Remove Doctor"
            subtitle="Confirm doctor profile removal from this branch"
            maxWidth="480px"
            footer={
              <>
                <button
                  type="button"
                  className="staff-footer-btn staff-footer-btn-outline"
                  onClick={() => setDoctorToDelete(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="staff-footer-btn"
                  style={{ backgroundColor: 'var(--red)', color: 'white', borderColor: 'var(--red)' }}
                  onClick={handleDeleteDoctor}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Removing…' : 'Remove Doctor'}
                </button>
              </>
            }
          >
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '28px' }}>⚠️</div>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                  Are you sure you want to remove {doctorToDelete.name}?
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  This doctor will no longer be listed for OPD consultations at your branch. Past medical and consultation records will be safely retained.
                </p>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </AppShell>
  );
}
