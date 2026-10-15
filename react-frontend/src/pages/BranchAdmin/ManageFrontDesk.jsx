/**
 * ManageFrontDesk.jsx — Branch Admin Manage Front Desk Staff Page
 * =========================================================================
 * Modular, clean front desk staff management for Branch Admins:
 *  - Metric KPI cards: Total Staff, Active Counters, Languages Covered (StatGrid / StatCard)
 *  - ContentCard with integrated gender dropdown filter in the action slot
 *  - Searchable staff roster table powered by reusable DataTable
 *  - Add & Edit staff workflows using FrontDeskFormModal
 *  - View staff credentials and assignments via FrontDeskDetailsModal
 *  - Safe removal with confirmation via StaffDeleteModal
 *  - Accessible feedback and alert notices with AlertBanner
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import ContentCard from '../../components/dashboard/ContentCard';
import StatCard, { StatGrid } from '../../components/dashboard/StatCard';
import DataTable from '../../components/dashboard/DataTable';
import AlertBanner from '../../components/dashboard/AlertBanner';
import FrontDeskFormModal from '../../components/branch-admin/FrontDeskFormModal';
import {
  FrontDeskDetailsModal,
  StaffActionButtons,
  StaffDeleteModal,
} from './components';
import {
  API_BASE_URL,
  getAuthHeaders,
  getInitials,
  formatShift,
} from './utils/staffHelpers';
import './ManageFrontDesk.css';

export default function ManageFrontDesk() {
  const { user } = useAuth();

  // Data State
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Filter State
  const [selectedGender, setSelectedGender] = useState('');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [viewStaff, setViewStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch front desk staff on mount & user change
  useEffect(() => {
    let isMounted = true;

    async function loadStaff() {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/frontdesk`, {
          headers: getAuthHeaders(user),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setStaffList(Array.isArray(data) ? data : []);
          }
        } else {
          throw new Error(`Failed to load front desk staff (HTTP ${res.status})`);
        }
      } catch (err) {
        if (isMounted) {
          setAlert({
            type: 'error',
            message: err.message || 'Failed to connect to backend server.',
          });
          setStaffList([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStaff();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // 2. Reload staff helper after mutations
  const reloadStaff = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/frontdesk`, {
        headers: getAuthHeaders(user),
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList(Array.isArray(data) ? data : []);
      }
    } catch {
      // Keep existing list on transient failure
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle soft delete of a front desk staff member
  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    setIsDeleting(true);

    try {
      const fdId = staffToDelete.userId || staffToDelete.id;
      const res = await fetch(`${API_BASE_URL}/frontdesk/${encodeURIComponent(fdId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(user),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Failed to remove staff member.');
      }

      setAlert({
        type: 'success',
        message: `${staffToDelete.name || 'Staff member'} removed successfully.`,
      });
      setStaffToDelete(null);
      await reloadStaff();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to remove staff member.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── DERIVED METRICS ───────────────────────────────────────────────────────
  const totalStaff = staffList.length;
  const activeCounters = new Set(staffList.map((s) => s.counter?.trim()).filter(Boolean)).size;
  const languagesCovered = new Set(
    staffList.flatMap((s) => (Array.isArray(s.languages) ? s.languages : [])).filter(Boolean)
  ).size;

  // Filter by gender for the DataTable
  const genderFilteredStaff = selectedGender
    ? staffList.filter((s) => s.gender === selectedGender)
    : staffList;

  // ── TABLE COLUMNS CONFIGURATION FOR DATA TABLE ────────────────────────────
  const columns = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (_, staff) => (
        <div
          className="fd-name-cell"
          onClick={() => setViewStaff(staff)}
          title="Click to view full staff details"
        >
          <div className="fd-avatar">{getInitials(staff.name)}</div>
          <div>
            <div className="fd-name-title">{staff.name || '—'}</div>
            <div className="fd-name-email">{staff.email || ''}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'counter',
      header: 'Counter',
      render: (val) =>
        val ? (
          <span className="fd-badge-counter">{val}</span>
        ) : (
          <span className="fd-badge-counter unassigned">Unassigned</span>
        ),
    },
    {
      key: 'shiftStart',
      header: 'Shift Hours',
      render: (_, staff) => {
        const shiftStr = formatShift(staff.shiftStart, staff.shiftEnd);
        return shiftStr !== '—' ? (
          <span className="fd-badge-shift">⏱ {shiftStr}</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        );
      },
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (val) => val || '—',
    },
    {
      key: 'gender',
      header: 'Gender',
      render: (val) => val || '—',
    },
    {
      key: 'languages',
      header: 'Languages',
      render: (val) => {
        const langs = Array.isArray(val) ? val : [];
        return langs.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
            {langs.map((lang) => (
              <span key={lang} className="fd-lang-pill">
                {lang}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, staff) => (
        <StaffActionButtons
          staff={staff}
          onView={() => setViewStaff(staff)}
          onEdit={() => {
            setEditingStaff(staff);
            setIsFormOpen(true);
          }}
          onDelete={() => setStaffToDelete(staff)}
        />
      ),
    },
  ];

  return (
    <AppShell pageTitle="Manage Front Desk">
      <div className="manage-frontdesk-page">

        {/* ── NOTIFICATION ALERT BANNER ───────────────────────────────────── */}
        {alert && (
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onDismiss={() => setAlert(null)}
          />
        )}

        {/* ── 1. PAGE HEADER ──────────────────────────────────────────────── */}
        <div className="fd-page-header">
          <div>
            <h1 className="fd-page-h1">Manage Front Desk</h1>
            <p className="fd-page-sub">
              Add, edit, and assign front desk reception staff for your branch
            </p>
          </div>
          <button
            type="button"
            className="fd-add-btn"
            onClick={() => {
              setEditingStaff(null);
              setIsFormOpen(true);
            }}
          >
            <span>＋</span>
            <span>Add Front Desk Staff</span>
          </button>
        </div>

        {/* ── 2. METRIC STAT CARDS ────────────────────────────────────────── */}
        <StatGrid>
          <StatCard
            label="Total Front Desk Staff"
            value={totalStaff}
            delta="Receptionists registered"
            deltaType="positive"
            icon="🖥️"
          />
          <StatCard
            label="Active Counters"
            value={activeCounters}
            delta="Counters currently assigned"
            deltaType="info"
            icon="📍"
          />
          <StatCard
            label="Languages Covered"
            value={languagesCovered}
            delta="Spoken across staff team"
            deltaType="warning"
            icon="🗣️"
          />
        </StatGrid>

        {/* ── 3. SEARCHABLE DATA TABLE IN CONTENT CARD ────────────────────── */}
        <ContentCard
          title="Front Desk Staff Roster"
          subtitle={`Showing ${genderFilteredStaff.length} of ${staffList.length} staff members`}
          action={
            <select
              className="fd-filter-select"
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              aria-label="Filter by gender"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          }
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              Loading front desk staff…
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={genderFilteredStaff}
              searchPlaceholder="Search by name, email, counter, or phone…"
              emptyMessage={
                staffList.length === 0
                  ? 'No front desk staff registered yet. Click "Add Front Desk Staff" to get started.'
                  : 'No front desk staff found matching your search or filter.'
              }
            />
          )}
        </ContentCard>

        {/* ── 4. CREATE / EDIT MODAL ───────────────────────────────────────── */}
        <FrontDeskFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingStaff(null);
          }}
          initialData={editingStaff}
          branchId={user?.branchId}
          onSuccess={(saved) => {
            setAlert({
              type: 'success',
              message: `${saved?.name || editingStaff?.name || 'Front desk staff'} saved successfully!`,
            });
            reloadStaff();
          }}
        />

        {/* ── 5. VIEW DETAILS MODAL ────────────────────────────────────────── */}
        <FrontDeskDetailsModal
          isOpen={Boolean(viewStaff)}
          onClose={() => setViewStaff(null)}
          staff={viewStaff}
          onEdit={(staff) => {
            setEditingStaff(staff);
            setIsFormOpen(true);
          }}
        />

        {/* ── 6. DELETE CONFIRMATION MODAL ─────────────────────────────────── */}
        <StaffDeleteModal
          isOpen={Boolean(staffToDelete)}
          onClose={() => setStaffToDelete(null)}
          onConfirm={handleDeleteStaff}
          staffName={staffToDelete?.name}
          roleLabel="front desk receptionist"
          isDeleting={isDeleting}
        />

      </div>
    </AppShell>
  );
}
