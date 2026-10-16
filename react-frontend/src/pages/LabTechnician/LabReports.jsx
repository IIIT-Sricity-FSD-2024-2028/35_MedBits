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

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import './LabReports.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function LabReports() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const techId = user?.userId || user?.id || 'LABTECH_001';

  // ── State ──────────────────────────────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('to_report'); // 'to_report' | 'submitted' | 'all'
  const [alert, setAlert] = useState(null);

  // Send Report Modal State
  const [reportingReq, setReportingReq] = useState(null);
  const [reportForm, setReportForm] = useState({ result: '', findings: '', remarks: '' });
  const [attachedFile, setAttachedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Report Preview Modal State
  const [previewReport, setPreviewReport] = useState(null);

  // ── 1. Fetch In-Progress Requests & Submitted Reports ──────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { role: 'labtech', 'x-user-id': techId };
      const [reqs, reps] = await Promise.all([
        fetch(`${API_BASE}/lab-requests`, { headers }).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE}/lab-reports`, { headers }).then((r) => (r.ok ? r.json() : [])),
      ]);
      setRequests(reqs);
      setReports(reps);
    } catch (_) {}
    setLoading(false);
  }, [techId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Deep-linking from query params (?reqId=... or ?id=...)
  useEffect(() => {
    const reqId = searchParams.get('reqId');
    const repId = searchParams.get('id');
    if (reqId && requests.length > 0) {
      const match = requests.find((r) => r.id === reqId);
      if (match) openSendModal(match);
    } else if (repId && reports.length > 0) {
      const match = reports.find((r) => r.id === repId || r.labRequestId === repId);
      if (match) setPreviewReport(match);
    }
  }, [searchParams, requests, reports]);

  // ── 2. Open Send Modal with Preloaded Draft ────────────────────────────────
  const openSendModal = async (req) => {
    setReportingReq(req);
    setReportForm({ result: '', findings: '', remarks: '' });
    setAttachedFile(null);
    try {
      const res = await fetch(`${API_BASE}/lab-requests/${encodeURIComponent(req.id)}/report`, {
        headers: { role: 'labtech', 'x-user-id': techId },
      });
      if (res.ok) {
        const draft = await res.json();
        if (draft) {
          setReportForm({ result: draft.result || '', findings: draft.findings || '', remarks: draft.remarks || '' });
          if (draft.fileAttachment) setAttachedFile(draft.fileAttachment);
        }
      }
    } catch (_) {}
  };

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
      setAlert({ type: 'error', message: 'Diagnostic Result is required before sending report.' });
      return;
    }
    setSubmitting(true);
    const endpoint = isSubmit ? 'submit' : 'draft';
    try {
      const res = await fetch(`${API_BASE}/lab-requests/${encodeURIComponent(reportingReq.id)}/report/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', role: 'labtech', 'x-user-id': techId },
        body: JSON.stringify({ ...reportForm, fileAttachment: attachedFile || undefined }),
      });
      if (!res.ok) throw new Error(`Failed to ${isSubmit ? 'submit' : 'save'} report`);
      setAlert({
        type: isSubmit ? 'success' : 'info',
        message: isSubmit ? 'Lab Report sent to Doctor and Patient!' : 'Draft saved successfully.',
      });
      setReportingReq(null);
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // ── 5. Search & Tab Filter Logic ───────────────────────────────────────────
  const inProgressList = useMemo(
    () => requests.filter((r) => r.status === 'in_progress' || r.status === 'accepted' || r.status === 'draft_report'),
    [requests]
  );
  const submittedList = useMemo(() => reports.filter((r) => r.status === 'submitted'), [reports]);

  const items = useMemo(() => {
    let list = [];
    if (activeTab === 'to_report') list = inProgressList.map((r) => ({ type: 'request', d: r }));
    else if (activeTab === 'submitted') list = submittedList.map((r) => ({ type: 'report', d: r }));
    else list = [...inProgressList.map((r) => ({ type: 'request', d: r })), ...submittedList.map((r) => ({ type: 'report', d: r }))];

    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(({ d }) =>
        `${d.id} ${d.patientName} ${d.patientId} ${d.testName} ${d.doctorName} ${d.result || ''}`.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, inProgressList, submittedList, search]);

  return (
    <AppShell pageTitle="Lab Reports">
      <div className="lr-page-container">

        {/* Alert Banner */}
        {alert && (
          <div className={`lr-alert-banner lr-alert-banner--${alert.type}`}>
            <span>{alert.type === 'success' ? '✓' : alert.type === 'error' ? '⚠️' : 'ℹ️'} {alert.message}</span>
            <button className="lr-alert-close" onClick={() => setAlert(null)}>✕</button>
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
                  items.map(({ type, d }) => (
                    <tr key={d.id}>
                      <td><strong>{d.patientName || d.patientId}</strong><div style={{ fontSize: '12px', color: '#64748b' }}>{d.patientId}</div></td>
                      <td style={{ color: '#0d9488', fontWeight: 600 }}>{d.testName}</td>
                      <td>{d.doctorName ? `Dr. ${d.doctorName.replace(/^Dr\.\s*/i, '')}` : 'Attending Physician'}</td>
                      <td>{d.submittedAt ? new Date(d.submittedAt).toLocaleDateString() : d.labTestDate || d.recommendationDate || '—'}</td>
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
          <div className="lr-modal-backdrop" onClick={() => setReportingReq(null)}>
            <div className="lr-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="lr-modal-header">
                <h3 className="lr-modal-title">Send Diagnostic Report (#{reportingReq.id})</h3>
                <button className="lr-modal-close-btn" onClick={() => setReportingReq(null)}>✕</button>
              </div>
              <div className="lr-modal-body">
                <div className="lr-patient-summary">
                  {[
                    ['Patient', `${reportingReq.patientName || reportingReq.patientId} (${reportingReq.patientId})`],
                    ['Doctor', `Dr. ${reportingReq.doctorName || 'Doctor'}`],
                    ['Test', reportingReq.testName],
                    ['Date', reportingReq.labTestDate || reportingReq.recommendationDate || '—'],
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
                <button className="lr-btn lr-btn--outline" onClick={() => setReportingReq(null)}>Cancel</button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="lr-btn lr-btn--outline" disabled={submitting} onClick={() => handleSaveReport(false)}>Save Draft</button>
                  <button className="lr-btn lr-btn--primary" disabled={submitting} onClick={() => handleSaveReport(true)}>
                    {submitting ? 'Sending…' : 'Send Lab Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Printable Report Preview Modal */}
        {previewReport && (
          <div className="lr-modal-backdrop" onClick={() => setPreviewReport(null)}>
            <div className="lr-modal-dialog" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
              <div className="lr-modal-header">
                <h3 className="lr-modal-title">Diagnostic Lab Report</h3>
                <button className="lr-modal-close-btn" onClick={() => setPreviewReport(null)}>✕</button>
              </div>
              <div className="lr-modal-body lr-report-sheet">
                <div className="lr-report-banner">
                  <div>
                    <div className="lr-report-brand-title">MEDBITS DIAGNOSTIC LABS</div>
                    <div className="lr-report-brand-sub">Clinical Pathology & Diagnostic Medicine</div>
                  </div>
                  <div className="lr-report-meta-box">
                    <div><strong>Report ID:</strong> {previewReport.id}</div>
                    <div><strong>Date:</strong> {previewReport.submittedAt ? new Date(previewReport.submittedAt).toLocaleDateString() : '—'}</div>
                  </div>
                </div>

                <div className="lr-report-grid">
                  <div><strong>Patient:</strong> {previewReport.patientName || previewReport.patientId} ({previewReport.patientId})</div>
                  <div><strong>Doctor:</strong> Dr. {previewReport.doctorName || 'Doctor'} | <strong>Test:</strong> {previewReport.testName}</div>
                </div>

                {[
                  { t: 'Diagnostic Result & Measured Values', v: previewReport.result, c: 'lr-report-result-box' },
                  { t: 'Clinical Findings', v: previewReport.findings, c: 'lr-report-text-box' },
                  { t: 'Remarks & Recommendations', v: previewReport.remarks, c: 'lr-report-text-box' },
                ].filter((s) => s.v).map(({ t, v, c }) => (
                  <div className="lr-report-section" key={t}>
                    <div className="lr-report-section-title">{t}</div>
                    <div className={c}>{v}</div>
                  </div>
                ))}

                {previewReport.fileAttachment?.fileData && (
                  <div className="lr-report-section">
                    <div className="lr-report-section-title">Attached Document</div>
                    <a href={previewReport.fileAttachment.fileData} download={previewReport.fileAttachment.fileName} className="lr-btn lr-btn--outline">
                      📄 Download {previewReport.fileAttachment.fileName}
                    </a>
                  </div>
                )}

                <div className="lr-report-signoff">
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Verified Electronic Diagnostic Record</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Certified By</div>
                    <strong>{previewReport.technicianName || 'Certified Lab Technician'}</strong>
                  </div>
                </div>
              </div>

              <div className="lr-modal-footer">
                <button className="lr-btn lr-btn--outline" onClick={() => setPreviewReport(null)}>Close</button>
                <button className="lr-btn lr-btn--primary" onClick={() => window.print()}>🖨️ Print Report</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
