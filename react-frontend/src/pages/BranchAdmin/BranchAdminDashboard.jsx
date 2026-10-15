/**
 * BranchAdminDashboard.jsx — Hospital Branch Admin Dashboard Page
 * =========================================================================
 * Dynamic dashboard connected to the MedBits backend:
 *  - Doctors, Front Desk, and Lab Technicians counts fetched from backend
 *  - Real Branch Revenue and completed consultations from earnings endpoint
 *  - Real Hospital Branch metadata (name, address, city, contact info)
 *  - Dynamic Clinical Department roster derived from active doctor profiles
 *  - Quick Actions navigating to respective branch management sections
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import WelcomeCard from '../../components/dashboard/WelcomeCard';
import StatCard, { StatGrid } from '../../components/dashboard/StatCard';
import QuickActions from '../../components/dashboard/QuickActions';
import ContentCard from '../../components/dashboard/ContentCard';
import DataTable from '../../components/dashboard/DataTable';
import { API_BASE_URL, getAuthHeaders } from '../../components/branch-admin/staffHelpers';

export default function BranchAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Backend Data State
  const [branchInfo, setBranchInfo] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [frontdeskStaff, setFrontdeskStaff] = useState([]);
  const [labTechs, setLabTechs] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all branch data dynamically on mount
  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const headers = getAuthHeaders(user);
      const branchParam = user?.branchId ? `?branchId=${encodeURIComponent(user.branchId)}` : '';

      try {
        const [docsRes, fdRes, ltRes, earnRes, branchesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/doctors${branchParam}`, { headers })
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
          fetch(`${API_BASE_URL}/frontdesk`, { headers })
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
          fetch(`${API_BASE_URL}/lab-technicians`, { headers })
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
          fetch(`${API_BASE_URL}/appointments/earnings/branch`, { headers })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          fetch(`${API_BASE_URL}/hospital-branches`, { headers })
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
        ]);

        if (!isMounted) return;

        // Set branch doctors
        const docsList = Array.isArray(docsRes) ? docsRes : [];
        setDoctors(docsList);

        // Filter frontdesk by branch if applicable
        const fdList = Array.isArray(fdRes) ? fdRes : [];
        setFrontdeskStaff(
          user?.branchId ? fdList.filter((f) => f.branchId === user.branchId) : fdList
        );

        // Filter lab technicians by branch if applicable
        const ltList = Array.isArray(ltRes) ? ltRes : [];
        setLabTechs(
          user?.branchId ? ltList.filter((t) => t.branchId === user.branchId) : ltList
        );

        // Branch earnings summary
        setEarnings(earnRes);

        // Find current branch metadata
        const branches = Array.isArray(branchesRes) ? branchesRes : [];
        const currentBranch = user?.branchId
          ? branches.find((b) => b.id === user.branchId) || null
          : branches[0] || null;
        setBranchInfo(currentBranch);
      } catch {
        // Fallbacks remain empty arrays
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // ── QUICK ACTIONS DEFINITION ──────────────────────────────────────────────
  const branchActions = [
    {
      label: 'Manage Doctors',
      icon: '🩺',
      color: '#0284c7',
      onClick: () => navigate('/branch-admin/doctors'),
    },
    {
      label: 'Manage Front Desk',
      icon: '🖥️',
      color: '#10b981',
      onClick: () => navigate('/branch-admin/frontdesk'),
    },
    {
      label: 'Lab Technicians',
      icon: '🔬',
      color: '#8b5cf6',
      onClick: () => navigate('/branch-admin/lab-technicians'),
    },
    {
      label: 'Leave Management',
      icon: '📅',
      color: '#f59e0b',
      onClick: () => navigate('/branch-admin/leave-management'),
    },
    {
      label: 'Branch Earnings',
      icon: '₹',
      color: '#059669',
      onClick: () => navigate('/branch-admin/earnings'),
    },
  ];

  // ── DYNAMIC DERIVED METRICS (No useMemo needed) ───────────────────────────
  const doctorCount = doctors.length;
  const fdCount = frontdeskStaff.length;
  const ltCount = labTechs.length;
  const totalStaff = doctorCount + fdCount + ltCount;

  const totalRevenue = earnings?.totalRevenue ?? 0;
  const branchProfit = earnings?.branchProfit ?? 0;
  const completedAppts = earnings?.completedAppointmentsCount ?? 0;
  const uniqueSpecializations = new Set(doctors.map((d) => d.specialization).filter(Boolean)).size;

  // Build dynamic departmental roster from active branch doctors
  const deptMap = {};
  doctors.forEach((doc) => {
    const deptKey = doc.department || doc.specialization || 'General Consultation';
    if (!deptMap[deptKey]) {
      deptMap[deptKey] = {
        dept: deptKey,
        doctors: [],
        slotsCount: 0,
      };
    }
    deptMap[deptKey].doctors.push(doc.name || 'Doctor');
    deptMap[deptKey].slotsCount += (doc.slots || []).length;
  });

  const departmentData = Object.values(deptMap).map((d) => ({
    dept: d.dept,
    leadDoctor: d.doctors.slice(0, 2).join(', ') + (d.doctors.length > 2 ? ` (+${d.doctors.length - 2} more)` : ''),
    rooms: `${d.doctors.length} Consultant${d.doctors.length > 1 ? 's' : ''}`,
    slots: `${d.slotsCount} Active Slot${d.slotsCount === 1 ? '' : 's'}`,
    status: 'Active',
  }));

  const deptColumns = [
    { key: 'dept', header: 'Specialty Department' },
    { key: 'leadDoctor', header: 'Active Consultants' },
    { key: 'rooms', header: 'Medical Staffing' },
    { key: 'slots', header: 'Available OPD Slots' },
    {
      key: 'status',
      header: 'Operational Status',
      render: (val) => (
        <span
          style={{
            background: '#dcfce7',
            color: '#16a34a',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          {val}
        </span>
      ),
    },
  ];

  return (
    <AppShell pageTitle="Branch Admin Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── 1. WELCOME BANNER ────────────────────────────────────────────── */}
        <WelcomeCard
          eyebrow="BRANCH ADMIN PORTAL"
          title={`Welcome back, ${user?.name || 'Admin'}!`}
          subtitle={
            branchInfo
              ? `Operational oversight for ${branchInfo.hospitalName} — ${branchInfo.branchName} (${branchInfo.city || ''})`
              : 'Oversee branch staff, active doctor schedules, daily patient footfall, and clinical revenue.'
          }
          stats={[
            { label: 'Total Doctors', value: String(doctorCount) },
            { label: 'Total Staff', value: String(totalStaff) },
            {
              label: 'Branch Profit',
              value: branchProfit > 0 ? `₹${(branchProfit / 1000).toFixed(1)}K` : '₹0',
            },
          ]}
        />

        {/* ── 2. METRIC STATS ──────────────────────────────────────────────── */}
        <StatGrid>
          <StatCard
            label="Active Doctors"
            value={isLoading ? '…' : String(doctorCount)}
            delta={`${uniqueSpecializations} Specializations`}
            deltaType="positive"
            icon="🩺"
          />
          <StatCard
            label="Front Desk Staff"
            value={isLoading ? '…' : String(fdCount)}
            delta="Reception & registration"
            deltaType="info"
            icon="🖥️"
          />
          <StatCard
            label="Lab Technicians"
            value={isLoading ? '…' : String(ltCount)}
            delta="Pathology diagnostics"
            deltaType="info"
            icon="🔬"
          />
          <StatCard
            label="Total Revenue"
            value={isLoading ? '…' : `₹${totalRevenue.toLocaleString('en-IN')}`}
            delta={`${completedAppts} completed consults`}
            deltaType="positive"
            icon="₹"
          />
        </StatGrid>

        {/* ── 3. QUICK ACTIONS GRID ─────────────────────────────────────────── */}
        <QuickActions
          title="Branch Staff Operations"
          actions={branchActions}
          variant="grid"
        />

        {/* ── 4. BRANCH DETAILS & ADMIN CONTEXT ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Branch Details Card */}
          <ContentCard
            title="Hospital Branch Information"
            subtitle="Registered medical facility credentials"
          >
            {branchInfo ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13.5px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hospital</span>
                  <div style={{ fontWeight: 600, color: 'var(--navy)', marginTop: '2px' }}>{branchInfo.hospitalName || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Branch</span>
                  <div style={{ fontWeight: 600, color: 'var(--navy)', marginTop: '2px' }}>{branchInfo.branchName || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>City / State</span>
                  <div style={{ color: 'var(--text)', marginTop: '2px' }}>{branchInfo.city ? `${branchInfo.city}, ${branchInfo.state || ''}` : '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pincode</span>
                  <div style={{ color: 'var(--text)', marginTop: '2px' }}>{branchInfo.pincode || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</span>
                  <div style={{ color: 'var(--text)', marginTop: '2px' }}>{branchInfo.phone || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</span>
                  <div style={{ color: 'var(--text)', marginTop: '2px' }}>{branchInfo.email || '—'}</div>
                </div>
                {branchInfo.address && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Address</span>
                    <div style={{ color: 'var(--text)', marginTop: '2px' }}>{branchInfo.address}</div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                {isLoading ? 'Loading branch details…' : 'Branch ID linked: ' + (user?.branchId || 'Not specified')}
              </p>
            )}
          </ContentCard>

          {/* Admin Account Scope */}
          <ContentCard
            title="Administrator Profile"
            subtitle="Current authenticated session details"
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13.5px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Admin Name</span>
                <div style={{ fontWeight: 600, color: 'var(--navy)', marginTop: '2px' }}>{user?.name || 'Branch Admin'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role</span>
                <div style={{ marginTop: '2px' }}>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>
                    Branch Admin
                  </span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</span>
                <div style={{ color: 'var(--text)', marginTop: '2px' }}>{user?.email || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Admin ID</span>
                <div style={{ color: 'var(--text)', marginTop: '2px' }}>{user?.id || user?.userId || '—'}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scoped Branch UUID</span>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px', wordBreak: 'break-all' }}>
                  {user?.branchId || 'Global / Superuser'}
                </div>
              </div>
            </div>
          </ContentCard>
        </div>

        {/* ── 5. DEPARTMENT ROSTER DATA TABLE ──────────────────────────────── */}
        <ContentCard
          title="Clinical Departments & Consultant Duty Roster"
          subtitle="Real-time departmental roster compiled from active doctor credentials"
        >
          {departmentData.length > 0 ? (
            <DataTable
              columns={deptColumns}
              data={departmentData}
              searchPlaceholder="Search departments or lead doctors..."
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏥</div>
              <p style={{ fontWeight: 600, color: 'var(--navy)' }}>No clinical departments registered yet</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>
                Add doctors to your branch to automatically populate the departmental roster.
              </p>
            </div>
          )}
        </ContentCard>

      </div>
    </AppShell>
  );
}
