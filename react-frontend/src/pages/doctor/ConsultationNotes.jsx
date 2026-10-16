/**
 * ConsultationNotes.jsx — Doctor Consultation Notes Master Page
 * =========================================================================
 * Location: src/pages/doctor/ConsultationNotes.jsx
 *
 * Integrates:
 *  - ConsultationToolbar (Patient lookup & New Note trigger)
 *  - UpcomingAppointmentsList (OPD queue for today)
 *  - ConsultationRecordsList (Historical consultations)
 *  - CompletedLabReportsList (Diagnostic lab reports)
 *  - ConsultationNoteEditor (Clinical note & prescription form)
 *  - LabReportModal (Popup viewer for lab reports)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';

import ConsultationToolbar from './consultation/ConsultationToolbar';
import UpcomingAppointmentsList from './consultation/UpcomingAppointmentsList';
import ConsultationRecordsList from './consultation/ConsultationRecordsList';
import CompletedLabReportsList from './consultation/CompletedLabReportsList';
import ConsultationNoteEditor from './consultation/ConsultationNoteEditor';
import LabReportModal from './consultation/LabReportModal';
import './consultation/consultation.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ConsultationNotes() {
  const { user } = useAuth();

  // ── VIEW STATE ────────────────────────────────────────────────────────
  // 'list' = Dashboard with queues & recent history
  // 'editor' = Note-taking workspace for selected patient
  const [viewMode, setViewMode] = useState('list');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeReport, setActiveReport] = useState(null);

  // ── DATA STORES ───────────────────────────────────────────────────────
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [labCatalog, setLabCatalog] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [alertBanner, setAlertBanner] = useState(null);

  const doctorId = user?.doctorId || (user?.id === 'DOCTOR_001' ? 'DOC001' : user?.id) || 'DOC001';
  const TODAY = new Date().toISOString().split('T')[0];

  // ── DATA FETCHING: Load initial OPD data from backend ─────────────────
  const loadConsultationData = useCallback(async () => {
    try {
      // 1. Fetch appointments assigned to this doctor (only upcoming ones)
      const apptRes = await fetch(`${API_BASE}/appointments/doctor/${encodeURIComponent(doctorId)}`, {
        headers: { role: 'doctor' },
      });
      if (apptRes.ok) {
        const apptData = await apptRes.json();
        const activeUpcoming = (Array.isArray(apptData) ? apptData : []).filter(
          (apt) => apt.status === 'upcoming'
        );
        setAppointments(activeUpcoming);
      } else {
        setAppointments([]);
      }

      // 2. Fetch doctor's existing consultation records
      const recordsRes = await fetch(`${API_BASE}/medical-records/doctor/${encodeURIComponent(doctorId)}`, {
        headers: { role: 'doctor' },
      });
      if (recordsRes.ok) {
        const recData = await recordsRes.json();
        const consultRecords = (Array.isArray(recData) ? recData : []).filter(
          (rec) => rec.type === 'consultation' || !rec.type
        );
        setRecords(consultRecords);
      }

      // 3. Fetch diagnostic lab tests catalog
      const testsRes = await fetch(`${API_BASE}/labtests`, {
        headers: { role: 'doctor' },
      });
      if (testsRes.ok) {
        const testsData = await testsRes.json();
        setLabCatalog(Array.isArray(testsData) ? testsData : []);
      }

      // 4. Fetch submitted lab reports for this doctor
      try {
        const reportsRes = await fetch(`${API_BASE}/lab-reports/doctor`, {
          headers: { role: 'doctor', 'x-user-id': doctorId },
        });
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setLabReports(Array.isArray(reportsData) ? reportsData : []);
        }
      } catch (_) {}
    } catch {
      setAppointments([]);
    }
  }, [doctorId]);

  useEffect(() => {
    loadConsultationData();
  }, [loadConsultationData]);

  // ── ACTION HANDLERS ───────────────────────────────────────────────────

  // Triggered when doctor starts or edits a note for an appointment
  const handleStartConsultation = (appointment) => {
    setSelectedAppointment(appointment);
    const patientObj = appointment.patient || {
      name: appointment.patientName || appointment.userId,
      userId: appointment.userId || appointment.patientId,
      gender: appointment.gender,
      age: appointment.age,
      appointmentId: appointment.id,
    };
    if (!patientObj.appointmentId) {
      patientObj.appointmentId = appointment.id;
    }
    setSelectedPatient(patientObj);
    setEditingRecord(null);
    setViewMode('editor');
    setAlertBanner(null);
  };

  // Triggered when doctor edits an existing record
  const handleEditRecord = (rec) => {
    setSelectedAppointment(null);
    setSelectedPatient({
      name: rec.patientName || rec.patientId,
      userId: rec.patientId,
      gender: rec.gender,
      age: rec.age,
      appointmentId: rec.appointmentId,
    });
    setEditingRecord(rec);
    setViewMode('editor');
    setAlertBanner(null);
  };

  // Submit consultation record to backend (PUT if editing, POST if new)
  const handleSaveNote = async (notePayload) => {
    setIsSaving(true);
    setAlertBanner(null);

    const payload = {
      doctorId: doctorId || user?.doctorId || user?.id,
      doctorName: user?.name || 'Dr. Medical Officer',
      specialization: user?.specialization || 'General Physician',
      date: new Date().toISOString().split('T')[0],
      ...notePayload,
    };

    const targetAppointmentId =
      notePayload.appointmentId || selectedAppointment?.id;

    try {
      if (editingRecord?.id) {
        // ── UPDATE EXISTING RECORD (PREVENTS 2 COPIES) ──────────────
        const response = await fetch(
          `${API_BASE}/medical-records/${encodeURIComponent(editingRecord.id)}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              role: 'doctor',
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update record');
        }

        const updatedRecord = await response.json();
        // Replace old record in state in-place so no duplicate is created
        setRecords((prev) =>
          prev.map((r) => (r.id === editingRecord.id ? updatedRecord : r))
        );
        setEditingRecord(null);
        setSelectedPatient(null);
        setSelectedAppointment(null);
        setViewMode('list');
        setAlertBanner({
          type: 'success',
          text: 'Consultation note updated successfully!',
        });
      } else {
        // ── CREATE NEW RECORD ───────────────────────────────────────
        const response = await fetch(`${API_BASE}/medical-records`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            role: 'doctor',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to save record');
        }

        const savedRecord = await response.json();
        setRecords((prev) => [savedRecord, ...prev]);

        // Complete the appointment in backend and remove from upcoming queue
        if (targetAppointmentId) {
          await fetch(
            `${API_BASE}/appointments/${encodeURIComponent(targetAppointmentId)}/complete`,
            {
              method: 'POST',
              headers: { role: 'doctor' },
            }
          ).catch(() => {});

          setAppointments((prev) =>
            prev.filter((a) => a.id !== targetAppointmentId)
          );
        }

        setSelectedAppointment(null);
        setSelectedPatient(null);
        setViewMode('list');
        setAlertBanner({
          type: 'success',
          text: 'Consultation note saved successfully!',
        });
      }
    } catch {
      setAlertBanner({
        type: 'error',
        text: 'Failed to save note. Please check backend connection.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell pageTitle="Consultation Notes">
      <div className="consultation-page-container">

        {/* Status notification banner */}
        {alertBanner && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              background: alertBanner.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: alertBanner.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${alertBanner.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            }}
          >
            {alertBanner.type === 'success' ? '✓' : '⚠️'} {alertBanner.text}
          </div>
        )}

        {/* ── 1. LIST VIEW (Default OPD Dashboard) ────────────────────── */}
        {viewMode === 'list' ? (
          <>
            <ConsultationToolbar
              appointments={appointments}
              onSelectAppointment={handleStartConsultation}
              onCreateNewNote={() => {
                setSelectedAppointment(null);
                setSelectedPatient(null);
                setEditingRecord(null);
                setViewMode('editor');
              }}
            />

            <UpcomingAppointmentsList
              appointments={appointments}
              onStartConsultation={handleStartConsultation}
            />

            <ConsultationRecordsList
              records={records}
              onViewAll={() => {}}
              onEditRecord={handleEditRecord}
              onViewLabReport={(rep) => setActiveReport(rep)}
            />

            <CompletedLabReportsList
              reports={labReports}
              onViewReport={(rep) => setActiveReport(rep)}
            />
          </>
        ) : (
          /* ── 2. NOTE EDITOR WORKSPACE ────────────────────────────── */
          <ConsultationNoteEditor
            patient={selectedPatient}
            initialRecord={editingRecord}
            labCatalog={labCatalog}
            labReports={labReports}
            onCancel={() => setViewMode('list')}
            onSave={handleSaveNote}
            isSaving={isSaving}
          />
        )}

        {/* Diagnostic Lab Report Viewer Modal */}
        <LabReportModal
          report={activeReport}
          onClose={() => setActiveReport(null)}
        />

      </div>
    </AppShell>
  );
}
