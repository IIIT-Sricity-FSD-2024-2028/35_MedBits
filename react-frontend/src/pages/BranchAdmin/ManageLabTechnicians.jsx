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
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
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
import {
  API_BASE_URL,
  getAuthHeaders,
  getInitials,
  formatDate,
} from './utils/staffHelpers';
import './ManageLabTechnicians.css';

export default function ManageLabTechnicians() {
  const { user } = useAuth();

  // Data State
  const [techList, setTechList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Filter State
  const [selectedGender, setSelectedGender] = useState('');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTech, setEditingTech] = useState(null);
  const [viewTech, setViewTech] = useState(null);
  const [techToDelete, setTechToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch lab technicians on mount & user change
  useEffect(() => {
    let isMounted = true;

    async function loadTechs() {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/lab-technicians`, {
          headers: getAuthHeaders(user),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setTechList(Array.isArray(data) ? data : []);
          }
        } else {
          throw new Error(`Failed to load lab technicians (HTTP ${res.status})`);
        }
      } catch (err) {
        if (isMounted) {
          setAlert({
            type: 'error',
            message: err.message || 'Failed to connect to backend server.',
          });
          setTechList([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTechs();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // 2. Reload lab technicians helper after mutations
  const reloadTechs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/lab-technicians`, {
        headers: getAuthHeaders(user),
      });
      if (res.ok) {
        const data = await res.json();
        setTechList(Array.isArray(data) ? data : []);
      }
    } catch {
      // Keep existing list on transient failure
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle removal of a lab technician
  const handleDeleteTech = async () => {
    if (!techToDelete) return;
    setIsDeleting(true);

    try {
      const techId = techToDelete.id || techToDelete.userId;
      const res = await fetch(`${API_BASE_URL}/lab-technicians/${encodeURIComponent(techId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(user),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Failed to remove lab technician.');
      }

      setAlert({
        type: 'success',
        message: `${techToDelete.name || 'Lab technician'} removed successfully.`,
      });
      setTechToDelete(null);
      await reloadTechs();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to remove lab technician.',
      });
    } finally {
      setIsDeleting(false);
    }
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
          onClick={() => setViewTech(tech)}
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
          onView={() => setViewTech(tech)}
          onEdit={(staff) => {
            const target = staff || tech;
            setEditingTech(target);
            setIsFormOpen(true);
          }}
          onDelete={() => setTechToDelete(tech)}
        />
      ),
    },
  ];

  return (
    <AppShell pageTitle="Manage Lab Technicians">
      <div className="manage-labtech-page">

        {/* ── NOTIFICATION ALERT BANNER ───────────────────────────────────── */}
        {alert && (
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onDismiss={() => setAlert(null)}
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
            onClick={() => {
              setEditingTech(null);
              setIsFormOpen(true);
            }}
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
              onChange={(e) => setSelectedGender(e.target.value)}
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
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTech(null);
          }}
          initialData={editingTech}
          branchId={user?.branchId}
          onSuccess={(saved) => {
            setAlert({
              type: 'success',
              message: `${saved?.name || editingTech?.name || 'Lab technician'} saved successfully!`,
            });
            reloadTechs();
          }}
        />

        {/* ── 5. VIEW DETAILS MODAL ────────────────────────────────────────── */}
        <LabTechDetailsModal
          isOpen={Boolean(viewTech)}
          onClose={() => setViewTech(null)}
          technician={viewTech}
          onEdit={(tech) => {
            setViewTech(null);
            setEditingTech(tech);
            setIsFormOpen(true);
          }}
        />

        {/* ── 6. DELETE CONFIRMATION MODAL ─────────────────────────────────── */}
        <StaffDeleteModal
          isOpen={Boolean(techToDelete)}
          onClose={() => setTechToDelete(null)}
          onConfirm={handleDeleteTech}
          staffName={techToDelete?.name}
          roleLabel="lab technician"
          isDeleting={isDeleting}
        />

      </div>
    </AppShell>
  );
}
