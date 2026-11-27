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
 *
 * Powered by Redux Toolkit (`branchFrontDeskSlice` + `authSlice`).
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchFrontDeskStaff,
  deleteFrontDeskStaff,
  setFrontDeskGenderFilter,
  openFrontDeskForm,
  closeFrontDeskForm,
  openFrontDeskView,
  closeFrontDeskView,
  openFrontDeskDelete,
  closeFrontDeskDelete,
  setFrontDeskAlert,
  clearFrontDeskAlert,
  selectFrontDeskStaff,
  selectFrontDeskStatus,
  selectFrontDeskAlert,
  selectFrontDeskGenderFilter,
  selectFrontDeskFormModal,
  selectViewFrontDeskStaff,
  selectFrontDeskStaffToDelete,
  selectIsDeletingFrontDesk,
} from '../../store/slices/branchAdmin/branchFrontDeskSlice';
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
import { getInitials, formatShift } from './utils/staffHelpers';
import './ManageFrontDesk.css';

export default function ManageFrontDesk() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  // Data & Filter State (Redux)
  const staffList = useSelector(selectFrontDeskStaff);
  const status = useSelector(selectFrontDeskStatus);
  const alert = useSelector(selectFrontDeskAlert);
  const selectedGender = useSelector(selectFrontDeskGenderFilter);
  const isLoading = status === 'idle' || status === 'loading';

  // Modal State (Redux)
  const formModal = useSelector(selectFrontDeskFormModal);
  const editingStaff = formModal.staff;
  const viewStaff = useSelector(selectViewFrontDeskStaff);
  const staffToDelete = useSelector(selectFrontDeskStaffToDelete);
  const isDeleting = useSelector(selectIsDeletingFrontDesk);

  // 1. Fetch front desk staff on mount & when the logged-in user changes
  useEffect(() => {
    dispatch(fetchFrontDeskStaff());
  }, [dispatch, user?.id, user?.branchId]);

  // 2. Handle soft delete of a front desk staff member
  const handleDeleteStaff = () => {
    if (!staffToDelete) return;
    dispatch(deleteFrontDeskStaff(staffToDelete));
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
          onClick={() => dispatch(openFrontDeskView(staff))}
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
          onView={() => dispatch(openFrontDeskView(staff))}
          onEdit={() => dispatch(openFrontDeskForm(staff))}
          onDelete={() => dispatch(openFrontDeskDelete(staff))}
        />
      ),
    },
  ];

  return (
      <div className="manage-frontdesk-page">

        {/* ── NOTIFICATION ALERT BANNER ───────────────────────────────────── */}
        {alert && (
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onDismiss={() => dispatch(clearFrontDeskAlert())}
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
            onClick={() => dispatch(openFrontDeskForm(null))}
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
              onChange={(e) => dispatch(setFrontDeskGenderFilter(e.target.value))}
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
          isOpen={formModal.isOpen}
          onClose={() => dispatch(closeFrontDeskForm())}
          initialData={editingStaff}
          branchId={user?.branchId}
          onSuccess={(saved) => {
            dispatch(
              setFrontDeskAlert({
                type: 'success',
                message: `${saved?.name || editingStaff?.name || 'Front desk staff'} saved successfully!`,
              })
            );
            dispatch(fetchFrontDeskStaff());
          }}
        />

        {/* ── 5. VIEW DETAILS MODAL ────────────────────────────────────────── */}
        <FrontDeskDetailsModal
          isOpen={Boolean(viewStaff)}
          onClose={() => dispatch(closeFrontDeskView())}
          staff={viewStaff}
          onEdit={(staff) => dispatch(openFrontDeskForm(staff))}
        />

        {/* ── 6. DELETE CONFIRMATION MODAL ─────────────────────────────────── */}
        <StaffDeleteModal
          isOpen={Boolean(staffToDelete)}
          onClose={() => !isDeleting && dispatch(closeFrontDeskDelete())}
          onConfirm={handleDeleteStaff}
          staffName={staffToDelete?.name}
          roleLabel="front desk receptionist"
          isDeleting={isDeleting}
        />

      </div>
  );
}
