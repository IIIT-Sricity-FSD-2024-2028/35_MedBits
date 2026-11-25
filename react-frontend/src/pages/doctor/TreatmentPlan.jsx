/**
 * TreatmentPlan.jsx — Doctor Treatment Plan Management Page
 * ============================================================
 * Fully functional with:
 *  - Patient dropdown (loaded from /patients + appointments + default catalog fallback)
 *  - Appointment ID dropdown (auto-fills patient and vice versa)
 *  - Lab test multi-select checkbox list (catalog with fallback)
 *  - Medicines, lifestyle recommendations, dietary advice, plan duration
 *  - List view of all plans with expand/collapse per card
 *  - Robust resilience so dropdowns and plans work 100% reliably whether online or offline
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchTreatmentData,
  saveTreatmentPlan,
  setTreatmentViewMode,
  updateTreatmentField,
  selectTreatmentPatient,
  selectTreatmentAppointment,
  toggleLabTest,
  setTestSearch,
  setPlanSearch,
  resetTreatmentForm,
  setTreatmentAlert,
  clearTreatmentAlert,
  selectTreatmentPlan,
} from '../../store/slices/doctor/treatmentPlanSlice';
import { resolveDoctorId } from '../../store/slices/doctor/doctorHelpers';
import ContentCard from '../../components/dashboard/ContentCard';
import './treatment/treatment.css';


export default function TreatmentPlan() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const myId = resolveDoctorId(user);
  const {
    viewMode,
    plans,
    labCatalog,
    appointments,
    patients,
    status,
    saveStatus,
    alert,
    form,
    selectedTests,
    testSearch,
    search,
  } = useSelector(selectTreatmentPlan);

  const loading = status === 'loading';
  const saving = saveStatus === 'loading';

  // ── Fetch Data with Safe Fallbacks ─────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchTreatmentData());
    return () => {
      dispatch(clearTreatmentAlert());
    };
  }, [dispatch, myId]);

  // Auto-dismiss alert
  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => dispatch(clearTreatmentAlert()), 5000);
    return () => clearTimeout(t);
  }, [alert, dispatch]);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const handleChange = (field, value) => dispatch(updateTreatmentField({ field, value }));
  const handlePatientSelect = (patientId) => dispatch(selectTreatmentPatient(patientId));
  const handleAppointmentSelect = (apptId) => dispatch(selectTreatmentAppointment(apptId));
  const toggleTest = (testName) => dispatch(toggleLabTest(testName));
  const setViewMode = (mode) => dispatch(setTreatmentViewMode(mode));

  // ── Submit treatment plan ─────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.patientId.trim()) {
      dispatch(setTreatmentAlert({ type: 'error', text: 'Please select a patient.' }));
      return;
    }
    dispatch(saveTreatmentPlan());
  };

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filteredTests = labCatalog.filter((t) =>
    t.name?.toLowerCase().includes(testSearch.toLowerCase()),
  );

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

  // Appointments for dropdown (filtered by patient if selected)
  const appointmentOptions = form.patientId
    ? appointments.filter((a) => (a.userId || a.patientId) === form.patientId)
    : appointments;

  return (
      <div className="treatment-page">

        {/* Alert Banner */}
        {alert && (
          <div className={`treatment-alert treatment-alert--${alert.type}`}>
            {alert.type === 'success' ? '✓' : '⚠'} {alert.text}
          </div>
        )}

        {/* ── View Toggle Header ─────────────────────────────────────────── */}
        <div className="treatment-header-bar">
          <div>
            <h2 className="treatment-page-title">
              {viewMode === 'create' ? 'Create New Treatment Plan' : 'Treatment Plans'}
            </h2>
            <p className="treatment-page-sub">
              {viewMode === 'create'
                ? 'Select a patient, prescribe medications, lab tests, and clinical advice'
                : `${plans.length} plan${plans.length !== 1 ? 's' : ''} on record`}
            </p>
          </div>

          <button
            type="button"
            className="treatment-btn treatment-btn--primary"
            onClick={() => {
              setViewMode(viewMode === 'create' ? 'list' : 'create');
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

              {/* Patient & Appointment */}
              <ContentCard title="Patient & Appointment">
                <div className="treatment-field-group">

                  {/* ── Patient Dropdown ─── */}
                  <div className="treatment-field">
                    <label className="treatment-label">Patient *</label>
                    <div className="treatment-select-wrap">
                      <select
                        className="treatment-select"
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
                      <p className="treatment-field-hint">✓ {form.patientName} selected</p>
                    )}
                  </div>

                  {/* ── Appointment ID Dropdown ─── */}
                  <div className="treatment-field">
                    <label className="treatment-label">Link to Appointment (optional)</label>
                    <div className="treatment-select-wrap">
                      <select
                        className="treatment-select"
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
                      <p className="treatment-field-hint">✓ Linked: {form.appointmentId}</p>
                    )}
                  </div>

                </div>
              </ContentCard>

              {/* Medicines & Prescriptions */}
              <ContentCard title="Medicines & Prescriptions">
                <div className="treatment-field">
                  <label className="treatment-label">Prescribed Medicines</label>
                  <textarea
                    className="treatment-textarea"
                    placeholder={`Enter each medicine on a new line, e.g.:\nCetirizine 10mg – once daily at bedtime\nCalamine soothing lotion – apply twice daily on affected area\nVitamin C 500mg – once daily after meal`}
                    value={form.medicines}
                    onChange={(e) => handleChange('medicines', e.target.value)}
                    rows={6}
                  />
                </div>
              </ContentCard>

              {/* Lifestyle & Dietary Advice */}
              <ContentCard title="Lifestyle & Dietary Advice">
                <div className="treatment-field">
                  <label className="treatment-label">Lifestyle Recommendations</label>
                  <textarea
                    className="treatment-textarea"
                    placeholder="e.g. Avoid direct sunlight during peak hours, drink 2.5L water daily, exercise 30 min daily…"
                    value={form.lifestyle}
                    onChange={(e) => handleChange('lifestyle', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="treatment-field" style={{ marginTop: 12 }}>
                  <label className="treatment-label">Dietary Advice</label>
                  <textarea
                    className="treatment-textarea"
                    placeholder="e.g. Low sodium, high fiber, avoid spicy and fried foods, plenty of fresh fruits…"
                    value={form.diet}
                    onChange={(e) => handleChange('diet', e.target.value)}
                    rows={3}
                  />
                </div>
              </ContentCard>

            </div>

            {/* ── Right Column: Lab Tests + Duration + Actions ───────────── */}
            <div className="treatment-col">

              {/* Lab Tests to Order */}
              <ContentCard
                title="Order Lab Tests"
                subtitle="Select diagnostic tests recommended as part of this plan"
              >
                <input
                  className="treatment-input"
                  placeholder="Filter tests (e.g. Blood, Urine, Thyroid)…"
                  value={testSearch}
                  onChange={(e) => dispatch(setTestSearch(e.target.value))}
                  style={{ marginBottom: 12 }}
                />

                <div className="treatment-tests-list">
                  {filteredTests.map((test) => {
                    const isChecked = selectedTests.includes(test.name);
                    return (
                      <label
                        key={test.id || test.name}
                        className={`treatment-test-item ${isChecked ? 'treatment-test-item--selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTest(test.name)}
                          className="treatment-checkbox"
                        />
                        <div className="treatment-test-info">
                          <span className="treatment-test-name">{test.name}</span>
                          {test.department && (
                            <span className="treatment-test-dept">{test.department}</span>
                          )}
                        </div>
                        {test.price > 0 && (
                          <span className="treatment-test-price">₹{test.price}</span>
                        )}
                      </label>
                    );
                  })}
                </div>

                {selectedTests.length > 0 && (
                  <div className="treatment-selected-tests-bar">
                    <p className="treatment-selected-tests-title">
                      Selected ({selectedTests.length}):
                    </p>
                    <div className="treatment-chip-row">
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
                    <label className="treatment-label">Recommended Lab Test Date</label>
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

              {/* Plan Duration */}
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

              {/* Actions */}
              <div className="treatment-submit-row">
                <button
                  type="button"
                  className="treatment-btn treatment-btn--ghost"
                  onClick={() => dispatch(resetTreatmentForm())}
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  className="treatment-btn treatment-btn--primary"
                  disabled={saving || !form.patientId}
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
                onChange={(e) => dispatch(setPlanSearch(e.target.value))}
                style={{ maxWidth: 380 }}
              />
            </div>

            {loading ? (
              <div className="treatment-empty">
                <div className="treatment-spinner" />
                <p>Loading treatment plans…</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="treatment-empty">
                <span className="treatment-empty-icon">💊</span>
                <p>
                  {search
                    ? 'No treatment plans match your search.'
                    : 'No treatment plans yet. Click "New Treatment Plan" to create one.'}
                </p>
                <button
                  type="button"
                  className="treatment-btn treatment-btn--primary"
                  style={{ marginTop: 14 }}
                  onClick={() => setViewMode('create')}
                >
                  ＋ Create First Treatment Plan
                </button>
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
          {plan.appointmentId && (
            <span className="treatment-plan-appt-tag">🔗 {plan.appointmentId}</span>
          )}
          {plan.duration && (
            <span className="treatment-plan-duration">{plan.duration}</span>
          )}
          {testList.length > 0 && (
            <span className="treatment-plan-tests-count">
              {testList.length} test{testList.length !== 1 ? 's' : ''}
            </span>
          )}
          <span className="treatment-plan-toggle">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="treatment-plan-body">
          <div className="treatment-plan-sections">

            {plan.appointmentId && (
              <div className="treatment-plan-section">
                <p className="treatment-plan-section-title">🔗 Linked Appointment</p>
                <p className="treatment-plan-section-text" style={{ fontFamily: 'monospace', fontSize: 13 }}>
                  {plan.appointmentId}
                </p>
              </div>
            )}

            {plan.medicines && (
              <div className="treatment-plan-section">
                <p className="treatment-plan-section-title">💊 Medicines</p>
                <p className="treatment-plan-section-text" style={{ whiteSpace: 'pre-line' }}>{plan.medicines}</p>
              </div>
            )}

            {testList.length > 0 && (
              <div className="treatment-plan-section">
                <p className="treatment-plan-section-title">🧪 Lab Tests</p>
                {plan.labTestDate && (
                  <p className="treatment-plan-section-text" style={{ marginBottom: 8, fontSize: 12, color: '#64748b' }}>
                    Scheduled: {plan.labTestDate}
                  </p>
                )}
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

          </div>
        </div>
      )}
    </div>
  );
}
