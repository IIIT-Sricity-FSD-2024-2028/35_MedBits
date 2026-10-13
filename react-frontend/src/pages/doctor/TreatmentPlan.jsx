/**
 * TreatmentPlan.jsx — Doctor Treatment Plan Management Page
 * ============================================================
 * Allows a doctor to:
 *  1. Create new treatment plans (medical record type = 'treatment')
 *  2. View all treatment plans written by this doctor
 *
 * A treatment plan contains:
 *  - Patient details
 *  - Medicines (prescribed drugs)
 *  - Lab tests ordered
 *  - Lifestyle recommendations
 *  - Dietary advice
 *  - Duration of the plan
 *
 * API Endpoints:
 *  GET  /medical-records/doctor/:doctorId  — fetch all records by this doctor
 *  POST /medical-records                   — create a new treatment plan
 *  GET  /labtests                          — get available lab tests
 *  GET  /appointments/doctor/:doctorId     — get today's patient queue
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import ContentCard from '../../components/dashboard/ContentCard';
import './treatment/treatment.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function TreatmentPlan() {
  const { user } = useAuth();

  // ── View mode ──────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create'

  // ── Data ──────────────────────────────────────────────────────────────────
  const [plans, setPlans] = useState([]);
  const [labCatalog, setLabCatalog] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  // ── Form State ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState(defaultForm());

  // ── Lab test multi-select ──────────────────────────────────────────────────
  const [selectedTests, setSelectedTests] = useState([]);
  const [testSearch, setTestSearch] = useState('');

  // ── Search / filter on list ────────────────────────────────────────────────
  const [search, setSearch] = useState('');

  function defaultForm() {
    return {
      patientId: '',
      patientName: '',
      appointmentId: '',
      medicines: '',
      lifestyle: '',
      diet: '',
      duration: '',
      labTestDate: '',
    };
  }

  // ── Fetch Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [recRes, testRes, apptRes] = await Promise.all([
        fetch(`${API_BASE}/medical-records/doctor/${encodeURIComponent(user.id)}`, {
          headers: { role: 'doctor' },
        }),
        fetch(`${API_BASE}/labtests`, { headers: { role: 'doctor' } }),
        fetch(`${API_BASE}/appointments/doctor/${encodeURIComponent(user.id)}`, {
          headers: { role: 'doctor' },
        }),
      ]);

      if (recRes.ok) {
        const data = await recRes.json();
        setPlans(Array.isArray(data) ? data.filter((r) => r.type === 'treatment') : []);
      }
      if (testRes.ok) {
        const data = await testRes.json();
        setLabCatalog(Array.isArray(data) ? data : []);
      }
      if (apptRes.ok) {
        const data = await apptRes.json();
        setAppointments(Array.isArray(data) ? data.filter((a) => a.status === 'upcoming') : []);
      }
    } catch {
      // graceful fallback
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Form field change ─────────────────────────────────────────────────────
  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  // When an appointment is selected, auto-fill patient info
  const handleAppointmentSelect = (apptId) => {
    const appt = appointments.find((a) => a.id === apptId);
    if (appt) {
      setForm((p) => ({
        ...p,
        appointmentId: apptId,
        patientId: appt.userId || appt.patientId || p.patientId,
        patientName: appt.patient?.name || appt.patientName || p.patientName,
      }));
    } else {
      setForm((p) => ({ ...p, appointmentId: '' }));
    }
  };

  // ── Lab test toggle ───────────────────────────────────────────────────────
  const toggleTest = (testName) => {
    setSelectedTests((prev) =>
      prev.includes(testName) ? prev.filter((t) => t !== testName) : [...prev, testName],
    );
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId.trim()) {
      setAlert({ type: 'error', text: 'Patient ID is required.' });
      return;
    }

    setSaving(true);
    setAlert(null);

    const payload = {
      doctorId: user?.id,
      doctorName: user?.name || 'Dr. Medical Officer',
      specialization: user?.specialization || 'General Physician',
      patientId: form.patientId.trim(),
      patientName: form.patientName.trim() || form.patientId.trim(),
      type: 'treatment',
      date: new Date().toISOString().split('T')[0],
      medicines: form.medicines.trim() || undefined,
      tests: selectedTests.join(' | ') || undefined,
      labTestDate: form.labTestDate || undefined,
      lifestyle: form.lifestyle.trim() || undefined,
      diet: form.diet.trim() || undefined,
      duration: form.duration.trim() || undefined,
      appointmentId: form.appointmentId.trim() || undefined,
    };

    try {
      const res = await fetch(`${API_BASE}/medical-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', role: 'doctor' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save treatment plan');
      }

      const saved = await res.json();
      setPlans((prev) => [saved, ...prev]);
      setAlert({ type: 'success', text: 'Treatment plan saved successfully!' });
      setForm(defaultForm());
      setSelectedTests([]);
      setViewMode('list');
    } catch (err) {
      setAlert({ type: 'error', text: err.message || 'Failed to save. Check backend.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Filtered lab tests ────────────────────────────────────────────────────
  const filteredTests = labCatalog.filter((t) =>
    t.name?.toLowerCase().includes(testSearch.toLowerCase()),
  );

  // ── Filtered plans list ───────────────────────────────────────────────────
  const filteredPlans = plans.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.patientName?.toLowerCase().includes(q) ||
      p.patientId?.toLowerCase().includes(q) ||
      p.medicines?.toLowerCase().includes(q) ||
      p.duration?.toLowerCase().includes(q)
    );
  });

  return (
    <AppShell pageTitle="Treatment Plans">
      <div className="treatment-page">

        {/* Alert Banner */}
        {alert && (
          <div className={`treatment-alert treatment-alert--${alert.type}`}>
            {alert.type === 'success' ? '✓' : '⚠'} {alert.text}
          </div>
        )}

        {/* ── Header Row ─────────────────────────────────────────────────── */}
        <div className="treatment-header-row">
          <div>
            <h2 className="treatment-page-title">Treatment Plans</h2>
            <p className="treatment-page-subtitle">
              {plans.length} treatment plan{plans.length !== 1 ? 's' : ''} on record
            </p>
          </div>
          <button
            className="treatment-btn treatment-btn--primary"
            onClick={() => {
              setViewMode(viewMode === 'create' ? 'list' : 'create');
              setAlert(null);
            }}
          >
            {viewMode === 'create' ? '← Back to List' : '＋ New Treatment Plan'}
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            VIEW: CREATE TREATMENT PLAN
        ══════════════════════════════════════════════════════════════════ */}
        {viewMode === 'create' && (
          <form className="treatment-form-grid" onSubmit={handleSubmit}>

            {/* ── Left Column: Patient + Medicines + Lifestyle ──────────── */}
            <div className="treatment-col">
              <ContentCard title="Patient & Appointment">
                <div className="treatment-field-group">

                  {/* Appointment selector */}
                  {appointments.length > 0 && (
                    <div className="treatment-field">
                      <label className="treatment-label">Link to Appointment (optional)</label>
                      <select
                        className="treatment-select"
                        value={form.appointmentId}
                        onChange={(e) => handleAppointmentSelect(e.target.value)}
                      >
                        <option value="">— Select from today's queue —</option>
                        {appointments.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.patient?.name || a.patientName || a.userId} — {a.slot} — {a.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="treatment-row">
                    <div className="treatment-field">
                      <label className="treatment-label">Patient ID *</label>
                      <input
                        className="treatment-input"
                        placeholder="e.g. PAT001"
                        value={form.patientId}
                        onChange={(e) => handleChange('patientId', e.target.value)}
                        required
                      />
                    </div>
                    <div className="treatment-field">
                      <label className="treatment-label">Patient Name</label>
                      <input
                        className="treatment-input"
                        placeholder="Full name"
                        value={form.patientName}
                        onChange={(e) => handleChange('patientName', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </ContentCard>

              <ContentCard title="Medicines & Prescriptions">
                <div className="treatment-field">
                  <label className="treatment-label">Prescribed Medicines</label>
                  <textarea
                    className="treatment-textarea"
                    placeholder={`Enter each medicine on a new line or separated by comma, e.g.:\nCetirizine 10mg – once daily\nCalamine lotion – twice daily`}
                    value={form.medicines}
                    onChange={(e) => handleChange('medicines', e.target.value)}
                    rows={5}
                  />
                </div>
              </ContentCard>

              <ContentCard title="Lifestyle & Dietary Advice">
                <div className="treatment-field">
                  <label className="treatment-label">Lifestyle Recommendations</label>
                  <textarea
                    className="treatment-textarea"
                    placeholder="e.g. Avoid harsh soaps, exercise 30 min daily, reduce stress…"
                    value={form.lifestyle}
                    onChange={(e) => handleChange('lifestyle', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="treatment-field" style={{ marginTop: 14 }}>
                  <label className="treatment-label">Dietary Advice</label>
                  <textarea
                    className="treatment-textarea"
                    placeholder="e.g. Increase omega-3 rich foods, reduce sodium intake…"
                    value={form.diet}
                    onChange={(e) => handleChange('diet', e.target.value)}
                    rows={3}
                  />
                </div>
              </ContentCard>
            </div>

            {/* ── Right Column: Lab Tests + Duration + Actions ──────────── */}
            <div className="treatment-col">
              <ContentCard title="Lab Tests Ordered">
                <div className="treatment-field">
                  <input
                    className="treatment-input"
                    placeholder="Search lab tests…"
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                  />
                </div>
                <div className="treatment-test-list">
                  {filteredTests.length === 0 ? (
                    <p className="treatment-empty-small">No tests found</p>
                  ) : (
                    filteredTests.map((t) => (
                      <label key={t.id || t.name} className="treatment-test-item">
                        <input
                          type="checkbox"
                          checked={selectedTests.includes(t.name)}
                          onChange={() => toggleTest(t.name)}
                          className="treatment-checkbox"
                        />
                        <span className="treatment-test-name">{t.name}</span>
                        {t.price > 0 && (
                          <span className="treatment-test-price">₹{t.price}</span>
                        )}
                      </label>
                    ))
                  )}
                </div>
                {selectedTests.length > 0 && (
                  <div className="treatment-selected-tests">
                    <p className="treatment-label">Selected Tests ({selectedTests.length})</p>
                    <div className="treatment-test-chips">
                      {selectedTests.map((t) => (
                        <span key={t} className="treatment-chip">
                          {t}
                          <button
                            type="button"
                            className="treatment-chip-remove"
                            onClick={() => toggleTest(t)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedTests.length > 0 && (
                  <div className="treatment-field" style={{ marginTop: 12 }}>
                    <label className="treatment-label">Lab Test Date</label>
                    <input
                      type="date"
                      className="treatment-input"
                      value={form.labTestDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleChange('labTestDate', e.target.value)}
                    />
                  </div>
                )}
              </ContentCard>

              <ContentCard title="Plan Duration">
                <div className="treatment-duration-grid">
                  {['1 week', '2 weeks', '1 month', '3 months', '6 months'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`treatment-duration-chip ${form.duration === d ? 'treatment-duration-chip--active' : ''}`}
                      onClick={() => handleChange('duration', form.duration === d ? '' : d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div className="treatment-field" style={{ marginTop: 12 }}>
                  <label className="treatment-label">Or enter custom duration</label>
                  <input
                    className="treatment-input"
                    placeholder="e.g. 10 days, until next review"
                    value={form.duration}
                    onChange={(e) => handleChange('duration', e.target.value)}
                  />
                </div>
              </ContentCard>

              <div className="treatment-submit-row">
                <button
                  type="button"
                  className="treatment-btn treatment-btn--ghost"
                  onClick={() => { setForm(defaultForm()); setSelectedTests([]); }}
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  className="treatment-btn treatment-btn--primary"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : '💊 Save Treatment Plan'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW: TREATMENT PLANS LIST
        ══════════════════════════════════════════════════════════════════ */}
        {viewMode === 'list' && (
          <ContentCard
            title="All Treatment Plans"
            subtitle="Browse and review treatment plans you've created"
          >
            <div className="treatment-search-row">
              <input
                className="treatment-input"
                placeholder="Search by patient name, ID, medicines…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 380 }}
              />
            </div>

            {loading ? (
              <div className="treatment-empty">Loading treatment plans…</div>
            ) : filteredPlans.length === 0 ? (
              <div className="treatment-empty">
                <span className="treatment-empty-icon">💊</span>
                <p>
                  {search
                    ? 'No treatment plans match your search.'
                    : 'No treatment plans yet. Click "New Treatment Plan" to create one.'}
                </p>
              </div>
            ) : (
              <div className="treatment-list">
                {filteredPlans.map((plan) => (
                  <TreatmentPlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            )}
          </ContentCard>
        )}

      </div>
    </AppShell>
  );
}

// ── Sub-component: Treatment Plan Card ──────────────────────────────────────
function TreatmentPlanCard({ plan }) {
  const [expanded, setExpanded] = useState(false);

  const date = plan.date
    ? new Date(plan.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const testList = plan.tests
    ? plan.tests.split(/[|,\n]/).map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="treatment-plan-card">
      <div className="treatment-plan-header" onClick={() => setExpanded(!expanded)}>
        <div className="treatment-plan-meta">
          <div className="treatment-plan-avatar">💊</div>
          <div>
            <p className="treatment-plan-patient">{plan.patientName || plan.patientId}</p>
            <p className="treatment-plan-id">{plan.patientId} · {date}</p>
          </div>
        </div>
        <div className="treatment-plan-right">
          {plan.duration && (
            <span className="treatment-plan-duration">{plan.duration}</span>
          )}
          {testList.length > 0 && (
            <span className="treatment-plan-tests-count">{testList.length} test{testList.length !== 1 ? 's' : ''}</span>
          )}
          <span className="treatment-plan-toggle">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="treatment-plan-body">
          <div className="treatment-plan-sections">
            {plan.medicines && (
              <div className="treatment-plan-section">
                <p className="treatment-plan-section-title">💊 Medicines</p>
                <p className="treatment-plan-section-text">{plan.medicines}</p>
              </div>
            )}
            {testList.length > 0 && (
              <div className="treatment-plan-section">
                <p className="treatment-plan-section-title">🧪 Lab Tests</p>
                <div className="treatment-chip-row">
                  {testList.map((t) => (
                    <span key={t} className="treatment-chip-readonly">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {plan.lifestyle && (
              <div className="treatment-plan-section">
                <p className="treatment-plan-section-title">🏃 Lifestyle</p>
                <p className="treatment-plan-section-text">{plan.lifestyle}</p>
              </div>
            )}
            {plan.diet && (
              <div className="treatment-plan-section">
                <p className="treatment-plan-section-title">🥗 Diet</p>
                <p className="treatment-plan-section-text">{plan.diet}</p>
              </div>
            )}
            {plan.labTestDate && (
              <div className="treatment-plan-section">
                <p className="treatment-plan-section-title">📅 Lab Test Date</p>
                <p className="treatment-plan-section-text">{plan.labTestDate}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
