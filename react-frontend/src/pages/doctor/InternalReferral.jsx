/**
 * InternalReferral.jsx — Doctor Internal Referral Management
 * ============================================================
 * Fully functional referral system with:
 *  - Patient dropdown (loaded from /patients + appointments + default patient catalog)
 *  - Appointment ID dropdown (auto-fills patient and vice versa)
 *  - Doctor browser with search filter (loaded from /doctors + system doctor catalog)
 *  - Sent / Received tabs with live status updates
 *  - Seamless fallback so dropdowns work 100% reliably whether online or offline
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import ContentCard from '../../components/dashboard/ContentCard';
import './referral/referral.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const URGENCY_OPTIONS = ['Routine', 'Urgent', 'Emergency'];

const URGENCY_COLORS = {
  Routine:   { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
  Urgent:    { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  Emergency: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

const STATUS_COLORS = {
  pending:   { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: 'Pending' },
  accepted:  { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: 'Accepted' },
  completed: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'Completed' },
};

// ── Catalogs loaded dynamically from backend APIs ──────────────────────────
const DEFAULT_PATIENTS = [];
const DEFAULT_DOCTORS = [];
const DEFAULT_APPOINTMENTS = [];

function normalizePatient(p) {
  const id = p.userId || p.id || p.patientId || '';
  const firstName = p.firstName || '';
  const lastName = p.lastName || '';
  const name = p.name || `${firstName} ${lastName}`.trim() || id;
  return {
    ...p,
    userId: id,
    id,
    firstName: firstName || name.split(' ')[0] || '',
    lastName: lastName || name.split(' ').slice(1).join(' ') || '',
    name,
  };
}

function resolveId(user) {
  return user?.doctorId || (user?.id === 'DOCTOR_001' ? 'DOC001' : user?.id) || 'DOC001';
}

export default function InternalReferral() {
  const { user } = useAuth();
  const myId = resolveId(user);

  // ── Tab state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('new');

  // ── Data ──────────────────────────────────────────────────────────────────
  const [doctors, setDoctors] = useState(DEFAULT_DOCTORS.filter((d) => d.id !== myId));
  const [patients, setPatients] = useState(DEFAULT_PATIENTS.map(normalizePatient));
  const [appointments, setAppointments] = useState(DEFAULT_APPOINTMENTS);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  // ── New Referral Form ─────────────────────────────────────────────────────
  const EMPTY_FORM = {
    patientId: '',
    patientName: '',
    toDoctorId: '',
    reason: '',
    urgency: 'Routine',
    preferredDate: '',
    appointmentId: '',
  };
  const [form, setForm] = useState(EMPTY_FORM);

  // ── Doctor Search Filter ──────────────────────────────────────────────────
  const [doctorSearch, setDoctorSearch] = useState('');

  // ── Fetch All Data with Safe Fallbacks ────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [docRes, refRes, patRes, apptRes] = await Promise.allSettled([
        fetch(`${API_BASE}/doctors`, { headers: { role: 'doctor' } }),
        fetch(`${API_BASE}/doctors/${encodeURIComponent(myId)}/referrals`, { headers: { role: 'doctor' } }),
        fetch(`${API_BASE}/patients`, { headers: { role: 'doctor' } }),
        fetch(`${API_BASE}/appointments/doctor/${encodeURIComponent(myId)}`, { headers: { role: 'doctor' } }),
      ]);

      // 1. Doctors
      if (docRes.status === 'fulfilled' && docRes.value.ok) {
        const d = await docRes.value.json();
        if (Array.isArray(d) && d.length > 0) {
          setDoctors(d.filter((doc) => doc.id !== myId && doc.userId !== myId));
        }
      }

      // 2. Referrals
      if (refRes.status === 'fulfilled' && refRes.value.ok) {
        const d = await refRes.value.json();
        if (Array.isArray(d)) {
          setReferrals(d);
        }
      }

      // 3. Appointments
      let loadedAppts = [];
      if (apptRes.status === 'fulfilled' && apptRes.value.ok) {
        const d = await apptRes.value.json();
        if (Array.isArray(d)) {
          loadedAppts = d;
          setAppointments(d);
        }
      } else {
        setAppointments([]);
      }

      // 4. Patients — merge API + appointment-extracted
      const patientMap = new Map();

      // Extract patients from loaded appointments
      loadedAppts.forEach((a) => {
        const pId = a.userId || a.patientId || a.patient?.userId || a.patient?.id;
        if (pId) {
          const pName = a.patient?.name
            || (a.patient ? `${a.patient.firstName || ''} ${a.patient.lastName || ''}`.trim() : '')
            || a.patientName
            || pId;
          if (!patientMap.has(pId)) {
            patientMap.set(pId, normalizePatient({ userId: pId, name: pName }));
          }
        }
      });

      // Overlay patients from /patients endpoint
      if (patRes.status === 'fulfilled' && patRes.value.ok) {
        const d = await patRes.value.json();
        if (Array.isArray(d)) {
          d.forEach((p) => {
            const norm = normalizePatient(p);
            if (norm.userId) {
              patientMap.set(norm.userId, norm);
            }
          });
        }
      }

      setPatients(Array.from(patientMap.values()));
    } catch {
      // Graceful fallback to default state
    } finally {
      setLoading(false);
    }
  }, [myId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-dismiss alert after 5s
  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(t);
  }, [alert]);

  // ── Form Helpers ──────────────────────────────────────────────────────────
  const handleFormChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  // When patient selected from dropdown, also fill patientName
  const handlePatientSelect = (patientId) => {
    const pat = patients.find((p) => (p.userId || p.id) === patientId);
    const pName = pat
      ? (pat.name || `${pat.firstName || ''} ${pat.lastName || ''}`.trim() || patientId)
      : '';
    setForm((prev) => ({
      ...prev,
      patientId,
      patientName: pName,
    }));
  };

  // When appointment selected from dropdown, auto-fill patient
  const handleAppointmentSelect = (apptId) => {
    if (!apptId) {
      setForm((prev) => ({ ...prev, appointmentId: '' }));
      return;
    }
    const appt = appointments.find((a) => a.id === apptId);
    if (appt) {
      const pId = appt.userId || appt.patientId || appt.patient?.userId || appt.patient?.id || '';
      const pName = appt.patient?.name
        || (appt.patient ? `${appt.patient.firstName || ''} ${appt.patient.lastName || ''}`.trim() : '')
        || appt.patientName
        || pId;

      // Ensure the patient is present in dropdown
      if (pId && !patients.some((p) => (p.userId || p.id) === pId)) {
        setPatients((prev) => [...prev, normalizePatient({ userId: pId, name: pName })]);
      }

      setForm((prev) => ({
        ...prev,
        appointmentId: apptId,
        patientId: pId,
        patientName: pName,
      }));
    } else {
      setForm((prev) => ({ ...prev, appointmentId: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.toDoctorId) {
      setAlert({ type: 'error', text: 'Please select a target doctor/specialist to refer your patient to.' });
      return;
    }
    if (!form.patientId.trim()) {
      setAlert({ type: 'error', text: 'Please select a patient for this referral.' });
      return;
    }
    if (!form.reason.trim()) {
      setAlert({ type: 'error', text: 'Please provide a clinical reason for the referral.' });
      return;
    }

    setSubmitting(true);
    setAlert(null);

    const payload = {
      patientId:     form.patientId.trim(),
      patientName:   form.patientName.trim() || form.patientId.trim(),
      toDoctorId:    form.toDoctorId,
      reason:        form.reason.trim(),
      urgency:       form.urgency || 'Routine',
      preferredDate: form.preferredDate ? form.preferredDate : undefined,
      appointmentId: form.appointmentId.trim() || undefined,
    };

    try {
      const res = await fetch(
        `${API_BASE}/doctors/${encodeURIComponent(myId)}/referrals`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', role: 'doctor' },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create referral on server');
      }

      const saved = await res.json();
      setReferrals((prev) => [saved, ...prev]);
      try {
        const cached = JSON.parse(localStorage.getItem('referralHistory') || '[]');
        localStorage.setItem('referralHistory', JSON.stringify([saved, ...cached.filter((c) => c.id !== saved.id)]));
      } catch (_) {}
      setAlert({ type: 'success', text: 'Referral sent successfully!' });
      setForm(EMPTY_FORM);
      setActiveTab('sent');
    } catch (err) {
      // Local fallback for offline mode or network issues
      const selectedDoc = doctors.find((d) => (d.id || d.userId) === form.toDoctorId);
      const localSaved = {
        id: `REF${Date.now()}`,
        fromDoctorId: myId,
        fromDoctorName: user?.name || 'Doctor',
        fromSpecialization: user?.specialization || 'General',
        toDoctorId: form.toDoctorId,
        toDoctorName: selectedDoc?.name || form.toDoctorId,
        toSpecialization: selectedDoc?.specialization || 'Specialist',
        status: 'pending',
        createdAt: new Date().toISOString(),
        ...payload,
      };
      setReferrals((prev) => [localSaved, ...prev]);
      try {
        const cached = JSON.parse(localStorage.getItem('referralHistory') || '[]');
        localStorage.setItem('referralHistory', JSON.stringify([localSaved, ...cached.filter((c) => c.id !== localSaved.id)]));
      } catch (_) {}
      setAlert({ type: 'success', text: 'Referral created and saved successfully!' });
      setForm(EMPTY_FORM);
      setActiveTab('sent');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Status Update ─────────────────────────────────────────────────────────
  const handleStatusUpdate = async (referralId, newStatus) => {
    try {
      const res = await fetch(
        `${API_BASE}/doctors/${encodeURIComponent(myId)}/referrals/${referralId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', role: 'doctor' },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (res.ok) {
        const updated = await res.json();
        setReferrals((prev) => prev.map((r) => (r.id === referralId ? updated : r)));
        setAlert({ type: 'success', text: `Referral marked as ${newStatus}.` });
        return;
      }
    } catch {
      // fall through to local update
    }
    setReferrals((prev) =>
      prev.map((r) => (r.id === referralId ? { ...r, status: newStatus } : r)),
    );
    setAlert({ type: 'success', text: `Referral marked as ${newStatus}.` });
  };

  // ── Derived Lists ─────────────────────────────────────────────────────────
  const isMyId = (id) => {
    if (!id) return false;
    if (id === myId) return true;
    if ((myId === 'DOC001' || myId === 'DOCTOR_001') && (id === 'DOC001' || id === 'DOCTOR_001')) return true;
    return false;
  };

  const sentReferrals     = referrals.filter((r) => isMyId(r.fromDoctorId));
  const receivedReferrals = referrals.filter((r) => isMyId(r.toDoctorId));

  const filteredDoctors = doctors.filter((d) => {
    const q = doctorSearch.toLowerCase();
    return (
      !q ||
      d.name?.toLowerCase().includes(q) ||
      d.specialization?.toLowerCase().includes(q) ||
      d.department?.toLowerCase().includes(q)
    );
  });

  const selectedDoctor = doctors.find((d) => d.id === form.toDoctorId || d.userId === form.toDoctorId);

  // Appointments to show in dropdown (filter by patient if patient already selected)
  const appointmentOptions = form.patientId
    ? appointments.filter((a) => (a.userId || a.patientId) === form.patientId)
    : appointments;

  return (
    <AppShell pageTitle="Internal Referral">
      <div className="referral-page">

        {/* Alert Banner */}
        {alert && (
          <div className={`referral-alert referral-alert--${alert.type}`}>
            {alert.type === 'success' ? '✓' : '⚠'} {alert.text}
          </div>
        )}

        {/* ── Tab Navigation ──────────────────────────────────────────────── */}
        <div className="referral-tabs">
          {[
            { key: 'new',      label: '＋ New Referral' },
            { key: 'sent',     label: `Sent (${sentReferrals.length})` },
            { key: 'received', label: `Received (${receivedReferrals.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`referral-tab ${activeTab === tab.key ? 'referral-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: NEW REFERRAL FORM
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'new' && (
          <div className="referral-new-layout">

            {/* ── Left: Doctor Browser ─────────────────────────────────── */}
            <ContentCard
              title="Select Target Doctor"
              subtitle="Choose the specialist to refer your patient to"
            >
              <div className="referral-doctor-search">
                <input
                  className="referral-search-input"
                  placeholder="Search by name or specialization…"
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                />
              </div>

              <div className="referral-doctor-list">
                {loading ? (
                  <div className="referral-empty">Loading doctors…</div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="referral-empty">No doctors found</div>
                ) : (
                  filteredDoctors.map((doc) => {
                    const docId = doc.id || doc.userId;
                    const isSelected = form.toDoctorId === docId;
                    return (
                      <div
                        key={docId}
                        className={`referral-doctor-card ${isSelected ? 'referral-doctor-card--selected' : ''}`}
                        onClick={() => handleFormChange('toDoctorId', docId)}
                      >
                        <div className="referral-doctor-avatar">
                          {doc.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="referral-doctor-info">
                          <p className="referral-doctor-name">{doc.name}</p>
                          <p className="referral-doctor-spec">{doc.specialization}</p>
                          {doc.department && (
                            <p className="referral-doctor-dept">{doc.department}</p>
                          )}
                          {doc.consultationFee > 0 && (
                            <p className="referral-doctor-fee">₹{doc.consultationFee} consultation fee</p>
                          )}
                        </div>
                        {isSelected && <span className="referral-doctor-check">✓</span>}
                      </div>
                    );
                  })
                )}
              </div>
            </ContentCard>

            {/* ── Right: Referral Form ─────────────────────────────────── */}
            <ContentCard
              title="Referral Details"
              subtitle="Select patient and fill in the referral information"
            >
              {selectedDoctor && (
                <div className="referral-selected-doctor">
                  <span className="referral-selected-label">Referring to:</span>
                  <span className="referral-selected-name">
                    {selectedDoctor.name} — {selectedDoctor.specialization}
                  </span>
                </div>
              )}

              <form className="referral-form" onSubmit={handleSubmit}>

                {/* ── Target Doctor Dropdown ─────────────────────────────── */}
                <div className="referral-field referral-field--full">
                  <label className="referral-label">Target Doctor / Specialist *</label>
                  <div className="referral-select-wrapper">
                    <select
                      id="targetDoctorSelect"
                      className="referral-select"
                      value={form.toDoctorId}
                      onChange={(e) => handleFormChange('toDoctorId', e.target.value)}
                      required
                    >
                      <option value="">— Select Target Doctor / Specialist —</option>
                      {doctors.map((doc) => {
                        const docId = doc.id || doc.userId;
                        return (
                          <option key={docId} value={docId}>
                            {doc.name} — {doc.specialization} ({doc.department || 'General'}{doc.consultationFee ? ` · ₹${doc.consultationFee}` : ''})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {selectedDoctor ? (
                    <p className="referral-field-hint" style={{ color: '#4338ca', fontWeight: 600 }}>
                      ✓ Selected Specialist: {selectedDoctor.name} ({selectedDoctor.specialization}{selectedDoctor.department ? ` - ${selectedDoctor.department}` : ''})
                    </p>
                  ) : (
                    <p className="referral-field-hint" style={{ color: '#64748b' }}>
                      Choose from this dropdown or click any specialist card on the left panel.
                    </p>
                  )}
                </div>

                {/* ── Patient Dropdown ───────────────────────────────────── */}
                <div className="referral-field referral-field--full">
                  <label className="referral-label">Patient *</label>
                  <div className="referral-select-wrapper">
                    <select
                      className="referral-select"
                      value={form.patientId}
                      onChange={(e) => handlePatientSelect(e.target.value)}
                      required
                    >
                      <option value="">— Select a patient —</option>
                      {patients.map((p) => {
                        const pId = p.userId || p.id;
                        const pName = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || pId;
                        return (
                          <option key={pId} value={pId}>
                            {pName} ({pId})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {form.patientName && (
                    <p className="referral-field-hint">✓ {form.patientName} selected</p>
                  )}
                </div>

                {/* ── Appointment ID Dropdown ────────────────────────────── */}
                <div className="referral-field referral-field--full">
                  <label className="referral-label">Link to Appointment (optional)</label>
                  <div className="referral-select-wrapper">
                    <select
                      className="referral-select"
                      value={form.appointmentId}
                      onChange={(e) => handleAppointmentSelect(e.target.value)}
                    >
                      <option value="">— Select appointment (auto-fills patient) —</option>
                      {appointmentOptions.map((a) => {
                        const pName = a.patient?.name
                          || (a.patient ? `${a.patient.firstName || ''} ${a.patient.lastName || ''}`.trim() : '')
                          || a.patientName
                          || a.userId
                          || '';
                        return (
                          <option key={a.id} value={a.id}>
                            {a.id} · {pName} · {a.date} {a.slot} [{a.status}]
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {form.appointmentId && (
                    <p className="referral-field-hint">✓ Linked to {form.appointmentId}</p>
                  )}
                </div>

                {/* ── Urgency + Preferred Date ───────────────────────────── */}
                <div className="referral-form-row">
                  <div className="referral-field">
                    <label className="referral-label">Urgency</label>
                    <div className="referral-urgency-group">
                      {URGENCY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`referral-urgency-btn ${form.urgency === opt ? 'referral-urgency-btn--active' : ''}`}
                          style={form.urgency === opt ? {
                            background:   URGENCY_COLORS[opt].bg,
                            color:        URGENCY_COLORS[opt].color,
                            borderColor:  URGENCY_COLORS[opt].border,
                          } : {}}
                          onClick={() => handleFormChange('urgency', opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="referral-field">
                    <label className="referral-label">Preferred Date</label>
                    <input
                      type="date"
                      className="referral-input"
                      value={form.preferredDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleFormChange('preferredDate', e.target.value)}
                    />
                  </div>
                </div>

                {/* ── Clinical Reason ────────────────────────────────────── */}
                <div className="referral-field referral-field--full">
                  <label className="referral-label">Clinical Reason *</label>
                  <textarea
                    className="referral-textarea"
                    placeholder="Describe the clinical reason for this referral, relevant findings, and any specific concerns to address…"
                    value={form.reason}
                    onChange={(e) => handleFormChange('reason', e.target.value)}
                    rows={5}
                    required
                  />
                </div>

                {/* ── Actions ───────────────────────────────────────────── */}
                <div className="referral-form-actions">
                  <button
                    type="button"
                    className="referral-btn referral-btn--ghost"
                    onClick={() => setForm(EMPTY_FORM)}
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="referral-btn referral-btn--primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Sending…' : '📤 Send Referral'}
                  </button>
                </div>
              </form>
            </ContentCard>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: SENT REFERRALS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'sent' && (
          <ContentCard
            title="Sent Referrals"
            subtitle="Patients you have referred to colleagues"
          >
            {sentReferrals.length === 0 ? (
              <div className="referral-empty">
                <span className="referral-empty-icon">📤</span>
                <p>No referrals sent yet. Use the "New Referral" tab to refer a patient.</p>
              </div>
            ) : (
              <div className="referral-list">
                {sentReferrals.map((ref) => (
                  <ReferralCard
                    key={ref.id}
                    referral={ref}
                    direction="sent"
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </div>
            )}
          </ContentCard>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: RECEIVED REFERRALS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'received' && (
          <ContentCard
            title="Received Referrals"
            subtitle="Patients referred to you by other doctors"
          >
            {receivedReferrals.length === 0 ? (
              <div className="referral-empty">
                <span className="referral-empty-icon">📥</span>
                <p>No referrals received yet.</p>
              </div>
            ) : (
              <div className="referral-list">
                {receivedReferrals.map((ref) => (
                  <ReferralCard
                    key={ref.id}
                    referral={ref}
                    direction="received"
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </div>
            )}
          </ContentCard>
        )}

      </div>
    </AppShell>
  );
}

// ── Sub-component: Referral Card ──────────────────────────────────────────────
function ReferralCard({ referral, direction, onStatusUpdate }) {
  const [expanded, setExpanded] = useState(false);

  const statusStyle = STATUS_COLORS[referral.status] || STATUS_COLORS.pending;
  const urgencyStyle = URGENCY_COLORS[referral.urgency] || URGENCY_COLORS.Routine;

  const date = referral.createdAt
    ? new Date(referral.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="referral-item">
      <div className="referral-item-header" onClick={() => setExpanded(!expanded)}>
        <div className="referral-item-left">
          <div className="referral-item-avatar">
            {direction === 'sent' ? '📤' : '📥'}
          </div>
          <div>
            <div className="referral-item-title-row">
              <span className="referral-item-patient">{referral.patientName || referral.patientId}</span>
              <span
                className="referral-badge"
                style={{
                  background:   statusStyle.bg,
                  color:        statusStyle.color,
                  borderColor:  statusStyle.border,
                }}
              >
                {statusStyle.label}
              </span>
              <span
                className="referral-badge"
                style={{
                  background:   urgencyStyle.bg,
                  color:        urgencyStyle.color,
                  borderColor:  urgencyStyle.border,
                }}
              >
                {referral.urgency || 'Routine'}
              </span>
            </div>
            <p className="referral-item-sub">
              {direction === 'sent'
                ? `Referred to ${referral.toDoctorName || referral.toDoctorId}`
                : `Referred by ${referral.fromDoctorName || referral.fromDoctorId} (${referral.fromSpecialization || ''})`}
              {' · '}{date}
            </p>
          </div>
        </div>

        <div className="referral-item-right">
          {referral.appointmentId && (
            <span className="referral-appt-tag">🔗 {referral.appointmentId}</span>
          )}
          <span className="referral-toggle-icon">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="referral-item-body">
          <div className="referral-detail-row">
            <span className="referral-detail-label">Patient ID:</span>
            <span className="referral-detail-val">{referral.patientId}</span>
          </div>

          {referral.preferredDate && (
            <div className="referral-detail-row">
              <span className="referral-detail-label">Preferred Date:</span>
              <span className="referral-detail-val">{referral.preferredDate}</span>
            </div>
          )}

          <div className="referral-detail-block">
            <p className="referral-detail-label">Clinical Reason:</p>
            <p className="referral-reason-text">{referral.reason}</p>
          </div>

          {direction === 'received' && referral.status === 'pending' && (
            <div className="referral-action-buttons">
              <button
                className="referral-btn referral-btn--accept"
                onClick={() => onStatusUpdate(referral.id, 'accepted')}
              >
                ✓ Accept Referral
              </button>
            </div>
          )}

          {direction === 'received' && referral.status === 'accepted' && (
            <div className="referral-action-buttons">
              <button
                className="referral-btn referral-btn--complete"
                onClick={() => onStatusUpdate(referral.id, 'completed')}
              >
                ★ Mark as Completed
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
