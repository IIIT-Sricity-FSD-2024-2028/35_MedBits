/**
 * Earnings.jsx — Hospital Branch Admin Earnings Page
 * =========================================================================
 * Real-time financial insights for Branch Administrators:
 *  - Live revenue data fetched from GET /appointments/earnings/branch
 *  - Month-based filtering with dynamic default to current active period
 *  - 5 High-Level KPI cards (Gross Revenue, Doctor Cuts, Net Profit, Lab Revenue)
 *  - Revenue Distribution progress bars & Financial Health indicators
 *  - Doctor payout cuts leaderboard & Recent Lab Test revenues
 *  - Searchable appointment transaction revenue ledger
 */

import React, { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, getAuthHeaders } from '../../components/branch-admin/staffHelpers';
import './Earnings.css';

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function fmtCurrency(val) {
  const num = Number(val || 0);
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const rawDate = String(dateStr);
  const d = new Date(rawDate.length === 10 ? `${rawDate}T00:00:00` : rawDate);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getMonthKeyFromDate(dateStr) {
  if (!dateStr) return '';
  const raw = String(dateStr);
  const d = new Date(raw.length === 10 ? `${raw}T00:00:00` : raw);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(monthKey) {
  if (!monthKey) {
    const now = new Date();
    return `${MONTHS_LONG[now.getMonth()]} ${now.getFullYear()}`;
  }
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) {
    const now = new Date();
    return `${MONTHS_LONG[now.getMonth()]} ${now.getFullYear()}`;
  }
  return `${MONTHS_LONG[month - 1]} ${year}`;
}

function getAvailableMonthKeys(data) {
  const keys = new Set();
  const currentKey = getCurrentMonthKey();
  const entries = Array.isArray(data?.entries) ? data.entries : [];
  const labEntries = Array.isArray(data?.labEntries) ? data.labEntries : [];

  entries.forEach((e) => {
    const k = getMonthKeyFromDate(e.date);
    if (k && k <= currentKey) keys.add(k);
  });

  labEntries.forEach((l) => {
    const k = getMonthKeyFromDate(l.date);
    if (k && k <= currentKey) keys.add(k);
  });

  keys.add(currentKey);
  return [...keys].sort((a, b) => b.localeCompare(a));
}

function calcPct(part, total) {
  if (!total || total <= 0) return 0;
  return Math.min(Math.max(Math.round((part / total) * 100), 2), 100);
}

export default function Earnings() {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch branch earnings on mount or auth change
  useEffect(() => {
    let isMounted = true;

    async function fetchEarnings() {
      setIsLoading(true);
      setError(null);

      try {
        const headers = getAuthHeaders(user);
        const res = await fetch(`${API_BASE_URL}/appointments/earnings/branch`, { headers });

        if (!res.ok) {
          throw new Error(`Failed to load earnings (HTTP ${res.status})`);
        }

        const json = await res.json();
        if (!isMounted) return;

        setData(json);

        // Determine default month
        const available = getAvailableMonthKeys(json);
        const cur = getCurrentMonthKey();
        const def = available.includes(cur) ? cur : available[0] || cur;
        setSelectedMonthKey(def);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Error fetching earnings data');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchEarnings();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Derived computations (no useMemo per user preference)
  const monthKeys = data ? getAvailableMonthKeys(data) : [getCurrentMonthKey()];
  const activeMonthKey = selectedMonthKey || monthKeys[0] || getCurrentMonthKey();
  const isCurrentMonth = activeMonthKey === getCurrentMonthKey();
  const monthLabel = getMonthLabel(activeMonthKey);

  const allAppointments = Array.isArray(data?.entries) ? data.entries : [];
  const allLabEntries = Array.isArray(data?.labEntries) ? data.labEntries : [];

  const monthAppointments = allAppointments.filter(
    (e) => getMonthKeyFromDate(e.date) === activeMonthKey
  );
  const monthLabEntries = allLabEntries.filter(
    (e) => getMonthKeyFromDate(e.date) === activeMonthKey
  );

  const monthAppointmentRevenue = monthAppointments.reduce(
    (s, e) => s + Number(e.consultationFee || 0),
    0
  );
  const monthLabRevenue = monthLabEntries.reduce(
    (s, e) => s + Number(e.testPrice || 0),
    0
  );
  const monthRevenue = monthAppointmentRevenue + monthLabRevenue;
  const monthCuts = monthAppointments.reduce(
    (s, e) => s + Number(e.doctorEarning || 0),
    0
  );
  const monthAppointmentProfit = monthAppointments.reduce(
    (s, e) => s + Number(e.branchProfit || 0),
    0
  );
  const monthProfit = monthAppointmentProfit + monthLabRevenue;

  const cutPct = calcPct(monthCuts, monthRevenue);
  const profitPct = calcPct(monthProfit, monthRevenue);
  const marginStr = monthRevenue > 0 ? `${Math.round((monthProfit / monthRevenue) * 100)}%` : '—';

  // Group doctor breakdown
  const doctorMap = {};
  monthAppointments.forEach((e) => {
    const key = e.doctorId || e.doctorName || 'unknown';
    if (!doctorMap[key]) {
      doctorMap[key] = {
        name: e.doctorName || 'Doctor',
        cut: 0,
        pct: e.percentageCut || 0,
        count: 0,
      };
    }
    doctorMap[key].cut += Number(e.doctorEarning || 0);
    doctorMap[key].count += 1;
  });
  const doctorRankings = Object.values(doctorMap).sort((a, b) => b.cut - a.cut);

  // Recent lab entries
  const recentLab = [...monthLabEntries]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  // Search-filtered appointments ledger
  const filteredLedger = monthAppointments
    .filter((e) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (e.patientName || '').toLowerCase().includes(q) ||
        (e.doctorName || '').toLowerCase().includes(q) ||
        (e.appointmentId || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <AppShell pageTitle="Branch Earnings">
      {isLoading ? (
        <div className="earnings-loading-state">
          <div className="earnings-spinner" />
          <p>Loading financial insights and branch revenue data...</p>
        </div>
      ) : error ? (
        <div className="earnings-empty-box" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius)' }}>
          <div className="earnings-empty-icon">⚠️</div>
          <div className="earnings-empty-text" style={{ color: '#dc2626' }}>{error}</div>
          <p style={{ fontSize: '13px', color: '#7f1d1d', marginTop: '6px' }}>
            Please verify network connection or permissions and reload the page.
          </p>
        </div>
      ) : (
        <div className="earnings-page-wrap">
          {/* ── 1. HERO BANNER & MONTH PICKER ───────────────────────────────── */}
          <div className="earnings-hero">
            <div>
              <div className="earnings-hero-eyebrow">Financial Analytics & Payouts</div>
              <h1 className="earnings-hero-title">Branch Revenue & Earnings</h1>
              <p className="earnings-hero-sub">
                Track consultation earnings, doctor payout shares, and retained hospital margins for {monthLabel}.
              </p>
            </div>

            <div className="earnings-hero-controls">
              <div className="earnings-month-select-wrap">
                <label htmlFor="branchMonthSelect" className="earnings-month-label">
                  Revenue Month
                </label>
                <select
                  id="branchMonthSelect"
                  className="earnings-month-select"
                  value={activeMonthKey}
                  onChange={(e) => setSelectedMonthKey(e.target.value)}
                >
                  {monthKeys.map((key) => (
                    <option key={key} value={key}>
                      {getMonthLabel(key)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="earnings-badge-card">
                <div className="earnings-badge-lbl">
                  {isCurrentMonth ? 'Current Month' : 'Selected Month'}
                </div>
                <div className="earnings-badge-val">{fmtCurrency(monthRevenue)}</div>
                <div className="earnings-badge-note">{monthLabel}</div>
              </div>
            </div>
          </div>

          {/* ── 2. 5 KPI METRICS ROW ───────────────────────────────────────── */}
          <div className="earnings-kpi-grid">
            <div className="earnings-kpi-card">
              <div className="earnings-kpi-title">All-Time Revenue</div>
              <div className="earnings-kpi-amount">{fmtCurrency(data?.totalRevenue || 0)}</div>
              <div className="earnings-kpi-desc">Across all historical months</div>
            </div>

            <div className="earnings-kpi-card">
              <div className="earnings-kpi-title">Monthly Gross</div>
              <div className="earnings-kpi-amount accent">{fmtCurrency(monthRevenue)}</div>
              <div className="earnings-kpi-desc">Appointments + Lab Tests</div>
            </div>

            <div className="earnings-kpi-card">
              <div className="earnings-kpi-title">Total Doctor Cuts</div>
              <div className="earnings-kpi-amount orange">{fmtCurrency(data?.totalDoctorCuts || 0)}</div>
              <div className="earnings-kpi-desc">Cumulative physician payouts</div>
            </div>

            <div className="earnings-kpi-card">
              <div className="earnings-kpi-title">Month Lab Revenue</div>
              <div className="earnings-kpi-amount blue">{fmtCurrency(monthLabRevenue)}</div>
              <div className="earnings-kpi-desc">{monthLabEntries.length} completed diagnostic tests</div>
            </div>

            <div className="earnings-kpi-card">
              <div className="earnings-kpi-title">Month Net Profit</div>
              <div className="earnings-kpi-amount green">{fmtCurrency(monthProfit)}</div>
              <div className="earnings-kpi-desc">Branch retained bottom line</div>
            </div>
          </div>

          {/* ── 3. MAIN ANALYTICS ROW: BARS & HEALTH + SIDE STACK ───────────── */}
          <div className="earnings-main-layout">
            {/* Left: Monthly Summary & Distribution */}
            <div className="earnings-panel">
              <div className="earnings-panel-header">
                <div>
                  <h2 className="earnings-panel-title">{monthLabel} Revenue Distribution</h2>
                  <p className="earnings-panel-sub">
                    Proportionate breakdown of gross collections, physician commission shares, and hospital profit.
                  </p>
                </div>
              </div>

              <div className="earnings-bars-list">
                <div className="earnings-bar-item">
                  <div className="earnings-bar-label">Total Revenue</div>
                  <div className="earnings-bar-track">
                    <div className="earnings-bar-fill rev" style={{ width: monthRevenue > 0 ? '100%' : '0%' }} />
                  </div>
                  <div className="earnings-bar-val">{fmtCurrency(monthRevenue)}</div>
                </div>

                <div className="earnings-bar-item">
                  <div className="earnings-bar-label">Doctor Cuts</div>
                  <div className="earnings-bar-track">
                    <div className="earnings-bar-fill cut" style={{ width: `${cutPct}%` }} />
                  </div>
                  <div className="earnings-bar-val">{fmtCurrency(monthCuts)}</div>
                </div>

                <div className="earnings-bar-item">
                  <div className="earnings-bar-label">Branch Profit</div>
                  <div className="earnings-bar-track">
                    <div className="earnings-bar-fill pro" style={{ width: `${profitPct}%` }} />
                  </div>
                  <div className="earnings-bar-val">{fmtCurrency(monthProfit)}</div>
                </div>
              </div>

              {/* Monthly Health Metric Tiles */}
              <div className="earnings-health-grid">
                <div className="earnings-health-tile">
                  <div className="earnings-health-label">Total Appts</div>
                  <div className="earnings-health-val">{data?.completedAppointmentsCount || 0}</div>
                </div>
                <div className="earnings-health-tile">
                  <div className="earnings-health-label">Month Appts</div>
                  <div className="earnings-health-val">{monthAppointments.length}</div>
                </div>
                <div className="earnings-health-tile">
                  <div className="earnings-health-label">Lab Tests Done</div>
                  <div className="earnings-health-val">{monthLabEntries.length}</div>
                </div>
                <div className="earnings-health-tile">
                  <div className="earnings-health-label">Profit Margin</div>
                  <div className="earnings-health-val" style={{ color: '#059669' }}>{marginStr}</div>
                </div>
              </div>
            </div>

            {/* Right: Side Stack (Top Doctors & Recent Lab) */}
            <div className="earnings-side-stack">
              {/* Doctor Breakdown Card */}
              <div className="earnings-side-card">
                <div className="earnings-side-header">
                  <h3 className="earnings-side-title">Top Earning Doctors</h3>
                  <span className="earnings-apt-badge">{doctorRankings.length} Active</span>
                </div>

                {doctorRankings.length === 0 ? (
                  <div className="earnings-empty-box" style={{ padding: '20px 0' }}>
                    <div className="earnings-empty-text">No doctor earnings for {monthLabel}.</div>
                  </div>
                ) : (
                  <div className="earnings-mini-list">
                    {doctorRankings.map((doc, idx) => (
                      <div key={idx} className="earnings-mini-row">
                        <div>
                          <div className="earnings-mini-name">{doc.name}</div>
                          <div className="earnings-mini-meta">
                            {doc.pct}% cut • {doc.count} {doc.count === 1 ? 'consultation' : 'consultations'}
                          </div>
                        </div>
                        <div className="earnings-mini-amt" style={{ color: '#d97706' }}>
                          {fmtCurrency(doc.cut)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lab Revenue Card */}
              <div className="earnings-side-card">
                <div className="earnings-side-header">
                  <h3 className="earnings-side-title">Recent Lab Revenue</h3>
                  <span className="earnings-apt-badge">{monthLabEntries.length} Tests</span>
                </div>

                {recentLab.length === 0 ? (
                  <div className="earnings-empty-box" style={{ padding: '20px 0' }}>
                    <div className="earnings-empty-text">No lab tests completed in {monthLabel}.</div>
                  </div>
                ) : (
                  <div className="earnings-mini-list">
                    {recentLab.map((lab, idx) => (
                      <div key={lab.reportId || idx} className="earnings-mini-row">
                        <div>
                          <div className="earnings-mini-name">{lab.testName || 'Diagnostic Test'}</div>
                          <div className="earnings-mini-meta">
                            {lab.patientName || 'Patient'} • {fmtDate(lab.date)}
                          </div>
                        </div>
                        <div className="earnings-mini-amt" style={{ color: '#2563eb' }}>
                          {fmtCurrency(lab.testPrice || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 4. REVENUE LEDGER DATA TABLE ─────────────────────────────────── */}
          <div className="earnings-ledger-panel">
            <div className="earnings-panel-header" style={{ alignItems: 'center' }}>
              <div>
                <h2 className="earnings-panel-title">Completed Consultation Ledger</h2>
                <p className="earnings-panel-sub">
                  Showing {filteredLedger.length} of {monthAppointments.length} completed transactions for {monthLabel}.
                </p>
              </div>

              <input
                type="text"
                className="earnings-search-input"
                placeholder="Search patient, doctor, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Filter ledger entries"
              />
            </div>

            <div className="earnings-ledger-table-wrap">
              <table className="earnings-ledger-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Appointment ID</th>
                    <th>Consultation Fee</th>
                    <th>Payout Structure</th>
                    <th>Doctor Earning</th>
                    <th>Branch Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="earnings-empty-box">
                          <div className="earnings-empty-icon">🪙</div>
                          <div className="earnings-empty-text">
                            {searchQuery
                              ? `No appointments found matching "${searchQuery}" in ${monthLabel}.`
                              : `No completed appointments recorded for ${monthLabel}.`}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((item) => (
                      <tr key={item.appointmentId}>
                        <td>{fmtDate(item.date)}</td>
                        <td><strong>{item.patientName || 'Unknown Patient'}</strong></td>
                        <td>{item.doctorName || 'Doctor'}</td>
                        <td>
                          <span className="earnings-apt-badge">{item.appointmentId}</span>
                        </td>
                        <td>
                          <span className="earnings-badge-pill rev">
                            {fmtCurrency(item.consultationFee)}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>
                          {item.percentageCut}% → {fmtCurrency(item.doctorEarning)}
                        </td>
                        <td>
                          <span className="earnings-badge-pill cut">
                            {fmtCurrency(item.doctorEarning)}
                          </span>
                        </td>
                        <td>
                          <span className="earnings-badge-pill profit">
                            {fmtCurrency(item.branchProfit)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
