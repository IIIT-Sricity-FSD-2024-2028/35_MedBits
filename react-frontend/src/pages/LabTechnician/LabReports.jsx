/**
 * LabReports.jsx — Lab Technician Diagnostic Lab Reports & Submissions
 * ==============================================================================
 * Clean, compact component handling the complete diagnostic reporting workflow:
 *  - Filter by InProgress Reporting, Submitted Reports, or All items.
 *  - Live search across patient, doctor, test, and report ID.
 *  - Send Report Modal: Record measured values, findings, remarks, and attachments.
 *    Supports Save Draft (PATCH /draft) and Send Lab Report (PATCH /submit).
 *  - Printable Report Modal: Branded medical diagnostic sheet with window.print().
 * ==============================================================================
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchLabReportsData,
  fetchReportDraft,
  saveLabReportDraft,
  submitLabReport,
  setLabReportsFeedback,
  clearLabReportsFeedback,
  clearActiveDraft,
  selectLabReportsRequests,
  selectLabReportsList,
  selectLabReportsLoading,
  selectLabReportDraftLoading,
  selectLabReportsSubmitting,
  selectLabReportsFeedback,
} from '../../store/slices/labTech/labReportsSlice';
import {
  getScheduledDate,
  formatLabDate,
  compareByScheduledDateDesc,
} from '../../store/slices/labTech/labTechHelpers';
import LabReportDetailModal from './components/LabReportDetailModal';
import './LabReports.css';


export default function LabReports() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [searchParams] = useSearchParams();

  // ── Redux State ────────────────────────────────────────────────────────────
  const requests = useSelector(selectLabReportsRequests);
  const reports = useSelector(selectLabReportsList);
  const loading = useSelector(selectLabReportsLoading);
  const draftLoading = useSelector(selectLabReportDraftLoading);
  const submitting = useSelector(selectLabReportsSubmitting);
  const alert = useSelector(selectLabReportsFeedback);

  // ── Local UI State ─────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('to_report'); // 'to_report' | 'submitted' | 'all'

  // Send Report Modal State
  const [reportingReq, setReportingReq] = useState(null);
  const [reportForm, setReportForm] = useState({ result: '', findings: '', remarks: '' });
  const [attachedFile, setAttachedFile] = useState(null);

  // Report Preview Modal State
  const [previewReport, setPreviewReport] = useState(null);
  const handledDeepLinkRef = useRef('');

  // ── 1. Fetch In-Progress Requests & Submitted Reports via Redux ────────────
  useEffect(() => {
    dispatch(fetchLabReportsData());
  }, [dispatch, user?.id, user?.userId]);

  // ── 2. Open Send Modal with Preloaded Draft ────────────────────────────────
  const openSendModal = useCallback(async (req) => {
    setReportingReq(req);
    setReportForm({ result: '', findings: '', remarks: '' });
    setAttachedFile(null);
    dispatch(clearActiveDraft());
    try {
      const draft = await dispatch(fetchReportDraft(req.id)).unwrap();
      if (draft) {
        setReportForm({
          result: draft.result || '',
          findings: draft.findings || '',
          remarks: draft.remarks || '',
        });
        if (draft.fileAttachment) setAttachedFile(draft.fileAttachment);
      }
    } catch {
      // Error surfaced via Redux feedback state
    }
  }, [dispatch]);

  const closeSendModal = () => {
    setReportingReq(null);
    dispatch(clearActiveDraft());
  };

  // Deep-linking from query params (?reqId=... or ?id=...)
  useEffect(() => {
    const reqId = searchParams.get('reqId');
    const repId = searchParams.get('id');
    const key = reqId ? `req:${reqId}` : repId ? `rep:${repId}` : '';
    if (!key || handledDeepLinkRef.current === key) return;

    if (reqId && requests.length > 0) {
      const match = requests.find((r) => r.id === reqId);
      if (match) {
        handledDeepLinkRef.current = key;
        openSendModal(match);
      }
    } else if (repId && reports.length > 0) {
      const match = reports.find((r) => r.id === repId || r.labRequestId === repId);
      if (match) {
        handledDeepLinkRef.current = key;
        setPreviewReport(match);
      }
    }
  }, [searchParams, requests, reports, openSendModal]);

  // ── 3. File Attachment Handler ─────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({ fileName: file.name, fileSize: file.size, fileData: reader.result });
    };
    reader.readAsDataURL(file);
  };

  // ── 4. Save Draft & Submit Handlers ─────────────────────────────────────────
  const handleSaveReport = async (isSubmit) => {
    if (!reportingReq) return;
    if (isSubmit && !reportForm.result.trim()) {
      dispatch(
        setLabReportsFeedback({
          type: 'error',
          message: 'Diagnostic Result is required before sending report.',
        })
      );
      return;
    }

    const payload = {
      ...reportForm,
      fileAttachment: attachedFile || undefined,
    };

    try {
      const thunk = isSubmit ? submitLabReport : saveLabReportDraft;
      await dispatch(thunk({ requestId: reportingReq.id, payload })).unwrap();
      setReportingReq(null);
    } catch {
      // Error surfaced via Redux feedback state
    }
  };

  // ── 5. Search, Request Association, & Scheduled-Date Sorting ───────────────
  const requestsById = useMemo(
    () => new Map(requests.map((r) => [r.id, r])),
    [requests]
  );

  const inProgressList = useMemo(
    () => requests.filter((r) => r.status === 'in_progress' || r.status === 'accepted' || r.status === 'draft_report'),
    [requests]
  );
  const submittedList = useMemo(() => reports.filter((r) => r.status === 'submitted'), [reports]);

  const items = useMemo(() => {
    const requestItems = inProgressList.map((r) => ({
      type: 'request',
      d: r,
      linkedRequest: r,
    }));
    const reportItems = submittedList.map((r) => ({
      type: 'report',
      d: r,
      linkedRequest: requestsById.get(r.labRequestId) || null,
    }));

    let list = [];
    if (activeTab === 'to_report') list = requestItems;
    else if (activeTab === 'submitted') list = reportItems;
    else list = [...requestItems, ...reportItems];

    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(({ d }) =>
        `${d.id} ${d.patientName} ${d.patientId} ${d.testName} ${d.doctorName} ${d.result || ''}`.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) =>
      compareByScheduledDateDesc(a.linkedRequest || a.d, b.linkedRequest || b.d)
    );
  }, [activeTab, inProgressList, submittedList, requestsById, search]);

  const previewLinkedRequest = previewReport
    ? requestsById.get(previewReport.labRequestId) || null
    : null;

  return (
      <div className="lr-page-container">

        {/* Alert Banner */}
        {alert && (
          <div className={`lr-alert-banner lr-alert-banner--${alert.type}`}>
            <span>{alert.type === 'success' ? '✓' : alert.type === 'error' ? '⚠️' : 'ℹ️'} {alert.message}</span>
            <button className="lr-alert-close" onClick={() => dispatch(clearLabReportsFeedback())}>✕</button>
          </div>
        )}

        {/* Search & Tabs Toolbar */}
        <div className="lr-card">
          <div className="lr-toolbar">
            <div className="lr-search-box">
              <span>🔍</span>
              <input
                className="lr-search-input"
                placeholder="Search patient, doctor, test, or report ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="lr-filter-group">
              {[
                { k: 'to_report', l: 'InProgress Reporting', c: inProgressList.length },
                { k: 'submitted', l: 'Submitted Reports', c: submittedList.length },
                { k: 'all', l: 'All Items', c: inProgressList.length + submittedList.length },
              ].map(({ k, l, c }) => (
                <button
                  key={k}
                  className={`lr-filter-btn ${activeTab === k ? 'lr-filter-btn--active' : ''}`}
                  onClick={() => setActiveTab(k)}
                >
                  {l} <span className="lr-filter-count">{c}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="lr-card">
          <div className="lr-table-wrapper">
            <table className="lr-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Test Name</th>
                  <th>Prescribed By</th>
                  <th>Scheduled Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '36px' }}>Loading lab reports…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '36px' }}>No items match your filter.</td></tr>
                ) : (
                  items.map(({ type, d, linkedRequest }) => (
                    <tr key={d.id}>
                      <td><strong>{d.patientName || d.patientId}</strong><div style={{ fontSize: '12px', color: '#64748b' }}>{d.patientId}</div></td>
                      <td style={{ color: '#0d9488', fontWeight: 600 }}>{d.testName}</td>
                      <td>{d.doctorName ? `Dr. ${d.doctorName.replace(/^Dr\.\s*/i, '')}` : 'Attending Physician'}</td>
                      <td>{formatLabDate(getScheduledDate(linkedRequest || d))}</td>
                      <td>
                        <span className={`lr-badge ${type === 'request' ? (d.status === 'draft_report' ? 'lr-badge--draft' : 'lr-badge--in-progress') : 'lr-badge--completed'}`}>
                          {type === 'request' ? (d.status === 'draft_report' ? 'Draft' : 'In Progress') : 'Submitted'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {type === 'request' ? (
                          <button className="lr-btn lr-btn--primary" onClick={() => openSendModal(d)}>Send Lab Report</button>
                        ) : (
                          <button className="lr-btn lr-btn--outline" onClick={() => setPreviewReport(d)}>View / Print</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Send Lab Report Modal */}
        {reportingReq && (
          <div className="lr-modal-backdrop" onClick={closeSendModal}>
            <div className="lr-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="lr-modal-header">
                <h3 className="lr-modal-title">Send Diagnostic Report (#{reportingReq.id})</h3>
                <button className="lr-modal-close-btn" onClick={closeSendModal}>✕</button>
              </div>
              <div className="lr-modal-body">
                <div className="lr-patient-summary">
                  {[
                    ['Patient', `${reportingReq.patientName || reportingReq.patientId} (${reportingReq.patientId})`],
                    ['Doctor', `Dr. ${reportingReq.doctorName || 'Doctor'}`],
                    ['Test', reportingReq.testName],
                    ['Scheduled Date', formatLabDate(getScheduledDate(reportingReq))],
                  ].map(([l, v]) => (
                    <div key={l}><span className="lr-ps-label">{l}</span><span className="lr-ps-value">{v}</span></div>
                  ))}
                  {reportingReq.consultationNote && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span className="lr-ps-label">Instructions</span>
                      <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#475569' }}>{reportingReq.consultationNote}</p>
                    </div>
                  )}
                </div>

                {[
                  { label: 'Diagnostic Result & Measured Values *', k: 'result', rows: 3 },
                  { label: 'Clinical Findings & Observations', k: 'findings', rows: 2 },
                  { label: 'Remarks & Recommendations', k: 'remarks', rows: 2 },
                ].map(({ label, k, rows }) => (
                  <div className="lr-form-group" key={k}>
                    <label className="lr-form-label">{label}</label>
                    <textarea
                      className="lr-textarea"
                      rows={rows}
                      value={reportForm[k]}
                      onChange={(e) => setReportForm({ ...reportForm, [k]: e.target.value })}
                    />
                  </div>
                ))}

                <div className="lr-form-group">
                  <label className="lr-form-label">Attach File (Optional)</label>
                  <input type="file" id="lrFile" style={{ display: 'none' }} onChange={handleFileUpload} />
                  {!attachedFile ? (
                    <div className="lr-dropzone" onClick={() => document.getElementById('lrFile')?.click()}>
                      📄 Click to attach report file (PDF, Doc, Image)
                    </div>
                  ) : (
                    <div className="lr-file-chip">
                      <span>📎 <strong>{attachedFile.fileName}</strong> ({Math.round(attachedFile.fileSize / 1024)} KB)</span>
                      <button className="lr-btn lr-btn--outline" onClick={() => setAttachedFile(null)}>Remove</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="lr-modal-footer">
                <button className="lr-btn lr-btn--outline" disabled={submitting} onClick={closeSendModal}>Cancel</button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="lr-btn lr-btn--outline" disabled={submitting || draftLoading} onClick={() => handleSaveReport(false)}>Save Draft</button>
                  <button className="lr-btn lr-btn--primary" disabled={submitting || draftLoading} onClick={() => handleSaveReport(true)}>
                    {submitting ? 'Sending…' : draftLoading ? 'Loading Draft…' : 'Send Lab Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shared Printable Report Preview Modal */}
        <LabReportDetailModal
          isOpen={Boolean(previewReport)}
          report={previewReport}
          request={previewLinkedRequest}
          onClose={() => setPreviewReport(null)}
        />

      </div>
  );
}
