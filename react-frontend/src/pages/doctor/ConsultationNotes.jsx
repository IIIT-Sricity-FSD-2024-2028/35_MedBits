/**
 * ConsultationNotes.jsx — Doctor Consultation Notes Master Page
 * =========================================================================
 * Location: src/pages/doctor/ConsultationNotes.jsx
 * Powered by Redux Toolkit (`consultationNotesSlice`).
 *
 * Integrates:
 *  - ConsultationToolbar (Patient lookup & New Note trigger)
 *  - UpcomingAppointmentsList (OPD queue for today)
 *  - ConsultationRecordsList (Historical consultations)
 *  - CompletedLabReportsList (Diagnostic lab reports)
 *  - ConsultationNoteEditor (Clinical note & prescription form)
 *  - LabReportModal (Popup viewer for lab reports)
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchConsultationData,
  saveConsultationNote,
  startConsultation,
  editRecord,
  createNewNote,
  backToList,
  openLabReport,
  closeLabReport,
  resetConsultationView,
  selectConsultationNotes,
} from '../../store/slices/doctor/consultationNotesSlice';

import ConsultationToolbar from './consultation/ConsultationToolbar';
import UpcomingAppointmentsList from './consultation/UpcomingAppointmentsList';
import ConsultationRecordsList from './consultation/ConsultationRecordsList';
import CompletedLabReportsList from './consultation/CompletedLabReportsList';
import ConsultationNoteEditor from './consultation/ConsultationNoteEditor';
import LabReportModal from './consultation/LabReportModal';
import './consultation/consultation.css';


export default function ConsultationNotes() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const {
    viewMode,
    selectedPatient,
    editingRecord,
    activeReport,
    appointments,
    records,
    labReports,
    labCatalog,
    saveStatus,
    alert: alertBanner,
  } = useSelector(selectConsultationNotes);

  const isSaving = saveStatus === 'loading';
  const userId = user?.id;

  // ── DATA FETCHING: Load initial OPD data from backend ─────────────────
  useEffect(() => {
    dispatch(fetchConsultationData());
    return () => {
      dispatch(resetConsultationView());
    };
  }, [dispatch, userId]);

  // ── ACTION HANDLERS ───────────────────────────────────────────────────
  const handleStartConsultation = (appointment) => dispatch(startConsultation(appointment));
  const handleEditRecord = (rec) => dispatch(editRecord(rec));
  const handleViewReport = (rep) => dispatch(openLabReport(rep));
  const handleSaveNote = (notePayload) => dispatch(saveConsultationNote(notePayload));

  return (
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
              onCreateNewNote={() => dispatch(createNewNote())}
            />

            <UpcomingAppointmentsList
              appointments={appointments}
              onStartConsultation={handleStartConsultation}
            />

            <ConsultationRecordsList
              records={records}
              onViewAll={() => {}}
              onEditRecord={handleEditRecord}
              onViewLabReport={handleViewReport}
            />

            <CompletedLabReportsList
              reports={labReports}
              onViewReport={handleViewReport}
            />
          </>
        ) : (
          /* ── 2. NOTE EDITOR WORKSPACE ────────────────────────────── */
          <ConsultationNoteEditor
            patient={selectedPatient}
            initialRecord={editingRecord}
            labCatalog={labCatalog}
            labReports={labReports}
            onCancel={() => dispatch(backToList())}
            onSave={handleSaveNote}
            isSaving={isSaving}
          />
        )}

        {/* Diagnostic Lab Report Viewer Modal */}
        <LabReportModal
          report={activeReport}
          onClose={() => dispatch(closeLabReport())}
        />

      </div>
  );
}
