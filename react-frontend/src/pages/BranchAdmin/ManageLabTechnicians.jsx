/**
 * ManageLabTechnicians.jsx — Branch Admin Manage Lab Technicians Page
 * =========================================================================
 * Comprehensive diagnostic lab technician management for Branch Admins:
 *  - Metric KPI cards: Total Technicians, Pathology Wing Status, Contact Coverage (StatGrid / StatCard)
 *  - ContentCard with gender filter dropdown in action slot
 *  - Searchable technician roster table powered by reusable DataTable
 *  - Add & Edit technician workflows using LabTechFormModal
 *  - View technician diagnostic credentials and assignment via LabTechDetailsModal
 *  - Safe removal with confirmation dialog via StaffDeleteModal
 *  - Accessible feedback and alert notices with AlertBanner
 *
 * Powered by Redux Toolkit (`branchLabTechniciansSlice` + `authSlice`).
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchLabTechnicians,
  deleteLabTechnician,
  setLabTechGenderFilter,
  openLabTechForm,
  closeLabTechForm,
  openLabTechView,
  closeLabTechView,
  openLabTechDelete,
  closeLabTechDelete,
  setLabTechAlert,
  clearLabTechAlert,
  selectLabTechnicians,
  selectLabTechniciansStatus,
  selectLabTechAlert,
  selectLabTechGenderFilter,
  selectLabTechFormModal,
  selectViewLabTech,
  selectLabTechToDelete,
  selectIsDeletingLabTech,
} from '../../store/slices/branchAdmin/branchLabTechniciansSlice';
import ContentCard from '../../components/dashboard/ContentCard';
import StatCard, { StatGrid } from '../../components/dashboard/StatCard';
import DataTable from '../../components/dashboard/DataTable';
import AlertBanner from '../../components/dashboard/AlertBanner';
import LabTechFormModal from '../../components/branch-admin/LabTechFormModal';
import {
  LabTechDetailsModal,
  StaffActionButtons,
  StaffDeleteModal,
} from './components';
import { getInitials, formatDate } from './utils/staffHelpers';
import './ManageLabTechnicians.css';

export default function ManageLabTechnicians() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  // Data & Filter State (Redux)
  const techList = useSelector(selectLabTechnicians);
  const status = useSelector(selectLabTechniciansStatus);
  const alert = useSelector(selectLabTechAlert);
  const selectedGender = useSelector(selectLabTechGenderFilter);
  const isLoading = status === 'idle' || status === 'loading';

  // Modal State (Redux)
  const formModal = useSelector(selectLabTechFormModal);
  const editingTech = formModal.tech;
  const viewTech = useSelector(selectViewLabTech);
  const techToDelete = useSelector(selectLabTechToDelete);
  const isDeleting = useSelector(selectIsDeletingLabTech);

  // 1. Fetch lab technicians on mount & when the logged-in user changes
  useEffect(() => {
    dispatch(fetchLabTechnicians());
  }, [dispatch, user?.id, user?.branchId]);

  // 2. Handle removal of a lab technician
  const handleDeleteTech = () => {
    if (!techToDelete) return;
    dispatch(deleteLabTechnician(techToDelete));
  };

  // ── DERIVED METRICS ───────────────────────────────────────────────────────
  const totalTechs = techList.length;
  const withPhoneCount = techList.filter((t) => Boolean(t.phone?.trim())).length;
  const withGenderCount = techList.filter((t) => Boolean(t.gender?.trim())).length;
  const maleCount = techList.filter((t) => t.gender === 'Male').length;
  const femaleCount = techList.filter((t) => t.gender === 'Female').length;

  // Filter by gender for the DataTable (including honest handling of unspecified gender)
  const genderFilteredTechs = selectedGender
    ? techList.filter((t) => {
        if (selectedGender === 'Unspecified') {
          return !t.gender || t.gender === '—';
        }
        return t.gender === selectedGender;
      })
    : techList;

  // ── TABLE COLUMNS CONFIGURATION FOR DATA TABLE ────────────────────────────
  const columns = [
    {
      key: 'name',
      header: 'Technician',
      render: (_, tech) => (
        <div
          className="lt-name-cell"
          onClick={() => dispatch(openLabTechView(tech))}
          title="Click to view full technician profile"
        >
          <div className="lt-avatar">{getInitials(tech.name)}</div>
          <div>
            <div className="lt-name-title">{tech.name || '—'}</div>
            <div className="lt-name-email">{tech.email || ''}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'id',
      header: 'Staff ID',
      render: (val, tech) => (
        <span className="lt-id-badge">
          {val || tech.userId || '—'}
        </span>
      ),
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
      key: 'createdAt',
      header: 'Registered On',
      render: (val) => formatDate(val),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => (
        <span className="lt-badge-status">
          <span className="lt-badge-status-dot" aria-hidden="true" />
          Active
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, tech) => (
        <StaffActionButtons
          staff={tech}
          onView={() => dispatch(openLabTechView(tech))}
          onEdit={(staff) => dispatch(openLabTechForm(staff || tech))}
          onDelete={() => dispatch(openLabTechDelete(tech))}
        />
      ),
    },
  ];

  return (
      <div className="manage-labtech-page">

        {/* ── NOTIFICATION ALERT BANNER ───────────────────────────────────── */}
        {alert && (
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onDismiss={() => dispatch(clearLabTechAlert())}
          />
        )}

        {/* ── 1. PAGE HEADER ──────────────────────────────────────────────── */}
        <div className="lt-page-header">
          <div>
            <h1 className="lt-page-h1">Manage Lab Technicians</h1>
            <p className="lt-page-sub">
              Add, update, and manage certified pathology lab technicians for your branch
            </p>
          </div>
          <button
            type="button"
            className="lt-add-btn"
            onClick={() => dispatch(openLabTechForm(null))}
          >
            <span>＋</span>
            <span>Add Lab Technician</span>
          </button>
        </div>

        {/* ── 2. METRIC STAT CARDS ────────────────────────────────────────── */}
        <StatGrid>
          <StatCard
            label="Total Lab Technicians"
            value={totalTechs}
            delta="Assigned to this branch"
            deltaType="positive"
            icon="🔬"
          />
          <StatCard
            label="Contact Verified"
            value={withPhoneCount}
            delta={totalTechs > 0 ? `${withPhoneCount} of ${totalTechs} with phone on file` : 'No staff registered'}
            deltaType="info"
            icon="📞"
          />
          <StatCard
            label="Gender Profiles"
            value={withGenderCount}
            delta={totalTechs > 0 ? `${maleCount} Male · ${femaleCount} Female` : 'No staff registered'}
            deltaType="warning"
            icon="👤"
          />
        </StatGrid>

        {/* ── 3. SEARCHABLE DATA TABLE IN CONTENT CARD ────────────────────── */}
        <ContentCard
          title="Lab Technicians Roster"
          subtitle={`Showing ${genderFilteredTechs.length} of ${techList.length} lab technicians`}
          action={
            <select
              className="lt-filter-select"
              value={selectedGender}
              onChange={(e) => dispatch(setLabTechGenderFilter(e.target.value))}
              aria-label="Filter by gender"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Unspecified">Unspecified</option>
            </select>
          }
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              Loading lab technicians…
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={genderFilteredTechs}
              searchPlaceholder="Search by name, email, staff ID, or phone…"
              emptyMessage={
                techList.length === 0
                  ? 'No lab technicians registered yet. Click "Add Lab Technician" to get started.'
                  : 'No lab technicians found matching your search or filter.'
              }
            />
          )}
        </ContentCard>

        {/* ── 4. CREATE / EDIT MODAL ───────────────────────────────────────── */}
        <LabTechFormModal
          isOpen={formModal.isOpen}
          onClose={() => dispatch(closeLabTechForm())}
          initialData={editingTech}
          branchId={user?.branchId}
          onSuccess={(saved) => {
            dispatch(
              setLabTechAlert({
                type: 'success',
                message: `${saved?.name || editingTech?.name || 'Lab technician'} saved successfully!`,
              })
            );
            dispatch(fetchLabTechnicians());
          }}
        />

        {/* ── 5. VIEW DETAILS MODAL ────────────────────────────────────────── */}
        <LabTechDetailsModal
          isOpen={Boolean(viewTech)}
          onClose={() => dispatch(closeLabTechView())}
          technician={viewTech}
          onEdit={(tech) => dispatch(openLabTechForm(tech))}
        />

        {/* ── 6. DELETE CONFIRMATION MODAL ─────────────────────────────────── */}
        <StaffDeleteModal
          isOpen={Boolean(techToDelete)}
          onClose={() => !isDeleting && dispatch(closeLabTechDelete())}
          onConfirm={handleDeleteTech}
          staffName={techToDelete?.name}
          roleLabel="lab technician"
          isDeleting={isDeleting}
        />

      </div>
  );
}
