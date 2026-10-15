/**
 * earnings.jsx — Super Admin Financial Earnings
 * =========================================================================
 * Clean, readable React port of the Super Admin earnings portal:
 *  - Network-wide platform overview (Revenue, Consultations, Active Branches)
 *  - Branch selector for facility-level financial drill-down
 *  - Dynamic month-based filtering (Current month default)
 *  - Branch KPIs (Gross Revenue, Doctor Cuts, Net Profit, Lab Revenue)
 *  - Monthly summary progress bars & health ratios
 *  - Doctor payout leaderboard & performance insights
 */

import React, { useState, useEffect, useMemo } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import './earnings.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const STORAGE_KEY = 'superadmin-selected-branch-id';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Helper: Format number to Indian Rupee (INR)
function formatCurrency(val) {
  const num = Number(val || 0);
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

// Helper: Format numbers with commas
function formatNumber(val) {
  return Number(val || 0).toLocaleString('en-IN');
}

// Helper: Extract YYYY-MM from a date string
function getMonthKey(dateStr) {
  if (!dateStr) return '';
  const d = new Date(String(dateStr).length === 10 ? `${dateStr}T00:00:00` : dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Helper: "2026-10" -> "October 2026"
function getMonthLabel(key) {
  if (!key) return '';
  const [year, month] = key.split('-').map(Number);
  if (!year || !month) return key;
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export default function Earnings() {
  const { user } = useAuth();

  // State: Platform-wide overview & branch list
  const [overview, setOverview] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ''
  );

  // State: Detailed earnings for selected branch & active month filter
  const [branchData, setBranchData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');

  // Common request headers with authentication role
  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    role: user?.role || 'super_admin',
    'x-user-id': user?.id || user?.userId || '',
  }), [user]);

  // 1. Fetch platform overview & branches list on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Fetch platform overview
        const ovRes = await fetch(`${API_BASE_URL}/super-admin/hospital-branches/earnings`, {
          headers: authHeaders,
        }).catch(() => null);
        if (ovRes?.ok) {
          setOverview(await ovRes.json());
        }

        // Fetch hospital branches list
        const brRes = await fetch(`${API_BASE_URL}/super-admin/hospital-branches`, {
          headers: authHeaders,
        }).catch(() => null);
        if (brRes?.ok) {
          const list = await brRes.json();
          if (Array.isArray(list) && list.length > 0) {
            setBranches(list);
            // Default to first branch if none currently selected
            setSelectedBranchId((prev) => {
              const valid = list.some((b) => b.id === prev);
              const nextId = valid ? prev : list[0].id;
              localStorage.setItem(STORAGE_KEY, nextId);
              return nextId;
            });
          }
        }
      } catch (err) {
        console.warn('Failed to load super admin data:', err);
      }
    }

    loadInitialData();
  }, [authHeaders]);

  // 2. Fetch specific branch earnings when selected branch changes
  useEffect(() => {
    if (!selectedBranchId) return;

    async function loadBranchEarnings() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/super-admin/hospital-branches/${encodeURIComponent(selectedBranchId)}/earnings`,
          { headers: authHeaders }
        ).catch(() => null);

        if (res?.ok) {
          const data = await res.json();
          setBranchData(data);

          // Determine available months from entries and default to current month
          const currentKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
          setSelectedMonth(currentKey);
        }
      } catch (err) {
        console.warn('Failed to load branch earnings:', err);
      }
    }

    loadBranchEarnings();
  }, [selectedBranchId, authHeaders]);

  // Available months list extracted from appointment & lab records
  const availableMonths = useMemo(() => {
    const keys = new Set();
    const currentKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    keys.add(currentKey);

    (branchData?.entries || []).forEach((e) => {
      const k = getMonthKey(e.date);
      if (k && k <= currentKey) keys.add(k);
    });

    (branchData?.labEntries || []).forEach((l) => {
      const k = getMonthKey(l.date);
      if (k && k <= currentKey) keys.add(k);
    });

    return [...keys].sort((a, b) => b.localeCompare(a));
  }, [branchData]);

  // Active month key (defaults to current month)
  const activeMonth = selectedMonth || availableMonths[0] || '';
  const monthLabel = getMonthLabel(activeMonth);

  // Selected branch details
  const activeBranch = useMemo(() => {
    return (
      branchData?.branch ||
      branches.find((b) => b.id === selectedBranchId) ||
      {}
    );
  }, [branchData, branches, selectedBranchId]);

  // Filter records for the selected month
  const monthAppointments = useMemo(() => {
    return (branchData?.entries || []).filter((e) => getMonthKey(e.date) === activeMonth);
  }, [branchData, activeMonth]);

  const monthLabTests = useMemo(() => {
    return (branchData?.labEntries || []).filter((l) => getMonthKey(l.date) === activeMonth);
  }, [branchData, activeMonth]);

  // Calculate monthly financial figures
  const metrics = useMemo(() => {
    const apptRev = monthAppointments.reduce((s, e) => s + Number(e.consultationFee || 0), 0);
    const labRev = monthLabTests.reduce((s, l) => s + Number(l.testPrice || 0), 0);
    const grossRev = apptRev + labRev;

    const cuts = monthAppointments.reduce((s, e) => s + Number(e.doctorEarning || 0), 0);
    const apptProfit = monthAppointments.reduce((s, e) => s + Number(e.branchProfit || 0), 0);
    const netProfit = apptProfit + labRev;

    const count = monthAppointments.length + monthLabTests.length;
    const avgTicket = count > 0 ? grossRev / count : 0;
    const efficiency = grossRev > 0 ? Math.round((netProfit / grossRev) * 100) : 0;

    return { grossRev, cuts, netProfit, labRev, avgTicket, efficiency };
  }, [monthAppointments, monthLabTests]);

  // Calculate doctor payout breakdown for the month
  const doctorPayouts = useMemo(() => {
    const map = {};
    monthAppointments.forEach((e) => {
      const id = e.doctorId || e.doctorName || 'Unknown';
      if (!map[id]) {
        map[id] = {
          name: e.doctorName || 'Doctor',
          cutTotal: 0,
          cutPct: Number(e.percentageCut || 0),
          count: 0,
        };
      }
      map[id].cutTotal += Number(e.doctorEarning || 0);
      map[id].count += 1;
    });
    return Object.values(map).sort((a, b) => b.cutTotal - a.cutTotal);
  }, [monthAppointments]);

  // Top doctor payout share percentage
  const topDoctorShare = useMemo(() => {
    if (!metrics.cuts || doctorPayouts.length === 0) return 0;
    return Math.round((doctorPayouts[0].cutTotal / metrics.cuts) * 100);
  }, [metrics.cuts, doctorPayouts]);

  // Handle switching branch
  const handleBranchChange = (e) => {
    const id = e.target.value;
    setSelectedBranchId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  // Helper for progress bar widths (2% to 100%)
  const getBarPct = (val) => {
    if (!metrics.grossRev || val <= 0) return 0;
    return Math.min(Math.max(Math.round((val / metrics.grossRev) * 100), 2), 100);
  };

  return (
    <AppShell pageTitle="Earnings">
      <div className="sa-earnings-wrapper">

        {/* ── 1. PLATFORM OVERVIEW BANNER & 4 HIGH-LEVEL CARDS ── */}
        <section className="sa-platform-hero">
          <div className="sa-platform-hero-copy">
            <span className="sa-eyebrow">Financial Overview</span>
            <h1 className="sa-platform-title">Earnings</h1>
            <p className="sa-platform-sub">
              Track overall platform revenue, then drill into a single branch using the selector below.
            </p>
          </div>
        </section>

        <section className="sa-overview-grid">
          {/* Card: This Month Revenue */}
          <div className="sa-overview-card sa-card-accent-teal">
            <div className="sa-overview-head">
              <span className="sa-overview-label">This Month Revenue</span>
              <span className="sa-overview-icon">📈</span>
            </div>
            <div className="sa-overview-value">
              {formatCurrency(overview?.currentMonthRevenue ?? overview?.thisMonthEarnings ?? 0)}
            </div>
            <div className="sa-overview-note">Across all branches</div>
          </div>

          {/* Card: Total Revenue */}
          <div className="sa-overview-card sa-card-accent-blue">
            <div className="sa-overview-head">
              <span className="sa-overview-label">Total Revenue</span>
              <span className="sa-overview-icon">💰</span>
            </div>
            <div className="sa-overview-value">
              {formatCurrency(overview?.totalRevenue ?? overview?.totalEarnings ?? 0)}
            </div>
            <div className="sa-overview-note">Across all branches</div>
          </div>

          {/* Card: Completed Consultations */}
          <div className="sa-overview-card sa-card-accent-emerald">
            <div className="sa-overview-head">
              <span className="sa-overview-label">Completed Consultations</span>
              <span className="sa-overview-icon">🩺</span>
            </div>
            <div className="sa-overview-value">
              {formatNumber(overview?.completedAppointmentsCount ?? 0)}
            </div>
            <div className="sa-overview-note">Fulfilled appointments</div>
          </div>

          {/* Card: Branches With Revenue */}
          <div className="sa-overview-card sa-card-accent-purple">
            <div className="sa-overview-head">
              <span className="sa-overview-label">Branches With Revenue</span>
              <span className="sa-overview-icon">🏥</span>
            </div>
            <div className="sa-overview-value">
              {formatNumber(overview?.totalBranchesWithRevenue ?? branches.length ?? 0)}
            </div>
            <div className="sa-overview-note">Contributing to platform revenue</div>
          </div>
        </section>

        {/* ── 2. BRANCH SELECTOR PANEL ── */}
        <section className="sa-branch-select-card">
          <div className="sa-branch-select-row">
            <div className="sa-branch-select-info">
              <h2 className="sa-branch-select-title">Branch Selection</h2>
              <p className="sa-branch-select-sub">
                Select a branch to view the same earnings metrics used in the branch admin portal.
              </p>
            </div>

            <div className="sa-branch-select-controls">
              <select
                className="sa-select-dropdown"
                value={selectedBranchId}
                onChange={handleBranchChange}
                disabled={branches.length === 0}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branchName || b.hospitalName} ({b.city || 'India'})
                  </option>
                ))}
              </select>

              <div className="sa-branch-select-status">
                <span>✓</span>
                <span>{activeBranch?.branchName ? `Showing ${activeBranch.branchName}` : 'Select a branch'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. BRANCH FINANCIAL DRILL-DOWN SHELL ── */}
        <div className="sa-branch-shell">

          {/* Branch Hero & Month Filter */}
          <section className="sa-branch-hero">
            <div className="sa-branch-hero-copy">
              <span className="sa-eyebrow">Branch Revenue Overview</span>
              <h2 className="sa-branch-hero-title">
                {activeBranch?.branchName || 'Select Branch'} — {activeBranch?.hospitalName || 'MedBits Hospital'}
              </h2>
              <p className="sa-branch-hero-meta">
                <span>📍 {activeBranch?.city || '—'}, {activeBranch?.state || '—'}</span>
                <span>•</span>
                <span>✉️ {activeBranch?.email || 'No email on file'}</span>
              </p>
            </div>

            <div className="sa-branch-hero-controls">
              {/* Month Dropdown */}
              <div className="sa-month-filter-wrap">
                <label className="sa-month-filter-label">Month</label>
                <select
                  className="sa-month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {availableMonths.map((key) => (
                    <option key={key} value={key}>
                      {getMonthLabel(key)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gross Badge */}
              <div className="sa-branch-badge">
                <span className="sa-branch-badge-label">Current Month</span>
                <span className="sa-branch-badge-value">{formatCurrency(metrics.grossRev)}</span>
                <span className="sa-branch-badge-note">{monthLabel}</span>
              </div>
            </div>
          </section>

          {/* 5 Branch KPI Cards */}
          <section className="sa-branch-kpis">
            <div className="sa-branch-kpi-card">
              <span className="sa-branch-kpi-label">Total Branch Revenue</span>
              <span className="sa-branch-kpi-value">{formatCurrency(branchData?.totalRevenue ?? 0)}</span>
              <span className="sa-branch-kpi-note">All completed appointments</span>
            </div>

            <div className="sa-branch-kpi-card">
              <span className="sa-branch-kpi-label">This Month Revenue</span>
              <span className="sa-branch-kpi-value">{formatCurrency(metrics.grossRev)}</span>
              <span className="sa-branch-kpi-note">{monthLabel}</span>
            </div>

            <div className="sa-branch-kpi-card">
              <span className="sa-branch-kpi-label">Total Doctor Cuts</span>
              <span className="sa-branch-kpi-value">{formatCurrency(branchData?.totalDoctorCuts ?? 0)}</span>
              <span className="sa-branch-kpi-note">Doctor earnings all-time</span>
            </div>

            <div className="sa-branch-kpi-card">
              <span className="sa-branch-kpi-label">Lab Test Revenue</span>
              <span className="sa-branch-kpi-value">{formatCurrency(metrics.labRev)}</span>
              <span className="sa-branch-kpi-note">Completed lab tests</span>
            </div>

            <div className="sa-branch-kpi-card">
              <span className="sa-branch-kpi-label">Branch Profit (This Month)</span>
              <span className="sa-branch-kpi-value">{formatCurrency(metrics.netProfit)}</span>
              <span className="sa-branch-kpi-note">Revenue minus doctor cuts</span>
            </div>
          </section>

          {/* Two-Column Analytics Layout */}
          <section className="sa-branch-layout">

            {/* Left: Monthly Summary Progress Bars & Health Indicators */}
            <div className="sa-analytics-panel">
              <div className="sa-panel-heading">
                <div>
                  <div className="sa-panel-eyebrow">This Month's Summary</div>
                  <h3 className="sa-panel-title">{monthLabel}</h3>
                  <p className="sa-panel-copy">
                    Revenue vs doctor cuts vs branch profit for the current month.
                  </p>
                </div>
                <span className="sa-pill sa-pill-green">
                  {monthAppointments.length} Appointments • {monthLabTests.length} Lab Tests
                </span>
              </div>

              {/* Summary Bars */}
              <div className="sa-summary-bars">
                <div className="sa-summary-bar-row">
                  <span className="sa-summary-bar-label">Gross Revenue</span>
                  <div className="sa-summary-bar-track">
                    <div className="sa-summary-bar-fill sa-fill-revenue" style={{ width: '100%' }} />
                  </div>
                  <span className="sa-summary-bar-value">{formatCurrency(metrics.grossRev)}</span>
                </div>

                <div className="sa-summary-bar-row">
                  <span className="sa-summary-bar-label">Doctor Cuts</span>
                  <div className="sa-summary-bar-track">
                    <div className="sa-summary-bar-fill sa-fill-cuts" style={{ width: `${getBarPct(metrics.cuts)}%` }} />
                  </div>
                  <span className="sa-summary-bar-value">{formatCurrency(metrics.cuts)}</span>
                </div>

                <div className="sa-summary-bar-row">
                  <span className="sa-summary-bar-label">Branch Profit</span>
                  <div className="sa-summary-bar-track">
                    <div className="sa-summary-bar-fill sa-fill-profit" style={{ width: `${getBarPct(metrics.netProfit)}%` }} />
                  </div>
                  <span className="sa-summary-bar-value">{formatCurrency(metrics.netProfit)}</span>
                </div>
              </div>

              {/* Branch Health Ratios */}
              <div className="sa-branch-health">
                <div className="sa-health-card">
                  <span className="sa-health-label">Total Appointments</span>
                  <div className="sa-health-value">
                    {formatNumber(branchData?.completedAppointmentsCount ?? branchData?.entries?.length ?? 0)}
                  </div>
                </div>

                <div className="sa-health-card">
                  <span className="sa-health-label">Month Appointments</span>
                  <div className="sa-health-value">{formatNumber(monthAppointments.length)}</div>
                </div>

                <div className="sa-health-card">
                  <span className="sa-health-label">Profit Margin</span>
                  <div className="sa-health-value">
                    {metrics.grossRev > 0 ? `${metrics.efficiency}%` : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Doctor Breakdown & Monthly Insights */}
            <aside className="sa-side-panel">

              {/* Cuts per Doctor */}
              <div className="sa-stacked-card">
                <div className="sa-stacked-card-header">
                  <div>
                    <div className="sa-panel-eyebrow">Doctor Breakdown</div>
                    <h3 className="sa-stacked-card-title">Cuts per doctor (this month)</h3>
                  </div>
                  <span className="sa-pill sa-pill-blue">Live</span>
                </div>

                <div className="sa-mini-list">
                  {doctorPayouts.length > 0 ? (
                    doctorPayouts.map((doc, idx) => (
                      <div key={idx} className="sa-mini-item">
                        <div>
                          <div className="sa-mini-label">{doc.name}</div>
                          <div className="sa-mini-meta">
                            {doc.cutPct}% cut • {doc.count} appointment{doc.count !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="sa-mini-value sa-cut-value">
                          {formatCurrency(doc.cutTotal)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="sa-mini-item">
                      <div className="sa-mini-meta">No completed appointments this month.</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Month Insights */}
              <div className="sa-stacked-card">
                <div className="sa-stacked-card-header">
                  <div>
                    <div className="sa-panel-eyebrow">Month Insights</div>
                    <h3 className="sa-stacked-card-title">Sharper view of this branch</h3>
                  </div>
                  <span className="sa-pill sa-pill-amber">Analytic</span>
                </div>

                <div className="sa-mini-list">
                  {/* Average Ticket */}
                  <div className="sa-insight-highlight">
                    <span className="sa-insight-highlight-label">Average Ticket</span>
                    <span className="sa-insight-highlight-value">{formatCurrency(metrics.avgTicket)}</span>
                    <span className="sa-mini-meta">Revenue per completed appointment this month</span>
                  </div>

                  {/* Top Doctor Share */}
                  <div className="sa-mini-item">
                    <div>
                      <div className="sa-mini-label">Top doctor share</div>
                      <div className="sa-mini-meta">Largest contributor to monthly doctor cuts</div>
                    </div>
                    <div className="sa-mini-value">{topDoctorShare}%</div>
                  </div>

                  {/* Profit Efficiency */}
                  <div className="sa-mini-item">
                    <div>
                      <div className="sa-mini-label">Profit efficiency</div>
                      <div className="sa-mini-meta">Branch profit as a share of revenue</div>
                    </div>
                    <div className="sa-mini-value">{metrics.efficiency}%</div>
                  </div>
                </div>
              </div>

            </aside>

          </section>
        </div>

      </div>
    </AppShell>
  );
}
