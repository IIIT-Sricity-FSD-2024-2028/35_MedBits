/**
 * SuperUserDashboard.jsx — Super Admin Branch & Admin Management Component
 * =========================================================================
 * Powered by Redux Toolkit (`superAdminDashboardSlice` + `authSlice`).
 *
 * Core Features:
 *  1. Hero section banner for Super Admin control room
 *  2. Create Branch Form (stores directly into the backend)
 *  3. Assign Branch Admin Form (links an admin account to an unassigned branch)
 *  4. Live Branch Registry Table (instant search filter & quick statistics drill-down)
 */

import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSuperAdminDashboard,
  createHospitalBranch,
  assignBranchAdmin,
  setDashboardSearchQuery,
  updateBranchFormField,
  updateAdminFormField,
  showDashboardToast,
  clearDashboardToast,
  selectDashboardBranches,
  selectDashboardSearchQuery,
  selectBranchForm,
  selectAdminForm,
  selectSuperAdminDashboardStatus,
  selectIsCreatingBranch,
  selectIsAssigningAdmin,
  selectDashboardToast,
} from '../../store/slices/superAdmin/superAdminDashboardSlice';
import './SuperUserDashboard.css';

export default function SuperUserDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ── 1. Redux State ─────────────────────────────────────────────────────
  const branches = useSelector(selectDashboardBranches);
  const searchQuery = useSelector(selectDashboardSearchQuery);
  const branchForm = useSelector(selectBranchForm);
  const adminForm = useSelector(selectAdminForm);
  const status = useSelector(selectSuperAdminDashboardStatus);
  const isCreatingBranch = useSelector(selectIsCreatingBranch);
  const isAssigningAdmin = useSelector(selectIsAssigningAdmin);
  const toast = useSelector(selectDashboardToast);

  const loading = status === 'loading';

  // Auto-dismiss toast notification after 3 seconds
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => dispatch(clearDashboardToast()), 3000);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  // ── 2. Fetch Dashboard & Branches ──────────────────────────────────────
  useEffect(() => {
    dispatch(fetchSuperAdminDashboard());
    return () => {
      dispatch(clearDashboardToast());
    };
  }, [dispatch]);

  // ── 3. Form Handlers ───────────────────────────────────────────────────
  const handleCreateBranch = (e) => {
    e.preventDefault();
    dispatch(createHospitalBranch(branchForm));
  };

  const handleAssignAdmin = (e) => {
    e.preventDefault();
    if (!adminForm.branchId) {
      dispatch(showDashboardToast({ message: 'Please select a branch first', type: 'error' }));
      return;
    }
    dispatch(assignBranchAdmin(adminForm));
  };

  // ── 5. Filtered Data & Unassigned Branches ────────────────────────────
  // Branches that do not have an assigned administrator yet
  const unassignedBranches = useMemo(
    () => branches.filter((b) => !b.branchAdmin),
    [branches]
  );

  // Search filter matching branch, hospital, location, or admin details
  const filteredBranches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return branches;
    return branches.filter((b) =>
      [
        b.branchName,
        b.hospitalName,
        b.city,
        b.state,
        b.branchAdmin?.name,
        b.branchAdmin?.email,
      ].some((val) => String(val || '').toLowerCase().includes(q))
    );
  }, [branches, searchQuery]);

  // ── 6. Render UI ───────────────────────────────────────────────────────
  return (
    <div className="sud-container">

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`sud-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Hero Banner Header */}
      <section className="sud-hero">
        <span className="sud-eyebrow">Super Admin Control Room</span>
        <h1>Branch Setup and Access Management</h1>
        <p>
          Create a new hospital branch, assign its branch admin, and keep both
          records synchronized with the live backend database.
        </p>
      </section>

      {/* 2-Column Panel Grid: Create Branch & Assign Branch Admin */}
      <div className="sud-panel-grid">

        {/* Panel 1: Create Branch */}
        <div className="sud-card">
          <div className="sud-card-header">
            <div>
              <h2>Create Branch</h2>
              <p>Store a new hospital branch directly in the database.</p>
            </div>
          </div>

          <form onSubmit={handleCreateBranch} className="sud-form">
            <div className="sud-form-grid">
              <label className="sud-field">
                <span>Hospital Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. MedBits Healthcare"
                  value={branchForm.hospitalName}
                  onChange={(e) => dispatch(updateBranchFormField({ field: 'hospitalName', value: e.target.value }))}
                />
              </label>

              <label className="sud-field">
                <span>Branch Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indiranagar Branch"
                  value={branchForm.branchName}
                  onChange={(e) => dispatch(updateBranchFormField({ field: 'branchName', value: e.target.value }))}
                />
              </label>

              <label className="sud-field full">
                <span>Address</span>
                <textarea
                  required
                  rows={2}
                  placeholder="Street address, landmark"
                  value={branchForm.address}
                  onChange={(e) => dispatch(updateBranchFormField({ field: 'address', value: e.target.value }))}
                />
              </label>

              <label className="sud-field">
                <span>City</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangalore"
                  value={branchForm.city}
                  onChange={(e) => dispatch(updateBranchFormField({ field: 'city', value: e.target.value }))}
                />
              </label>

              <label className="sud-field">
                <span>State</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karnataka"
                  value={branchForm.state}
                  onChange={(e) => dispatch(updateBranchFormField({ field: 'state', value: e.target.value }))}
                />
              </label>

              <label className="sud-field">
                <span>Pincode</span>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. 560038"
                  value={branchForm.pincode}
                  onChange={(e) => dispatch(updateBranchFormField({ field: 'pincode', value: e.target.value }))}
                />
              </label>

              <label className="sud-field">
                <span>Phone</span>
                <input
                  type="text"
                  required
                  maxLength={20}
                  placeholder="e.g. +91 80 4123 4567"
                  value={branchForm.phone}
                  onChange={(e) => dispatch(updateBranchFormField({ field: 'phone', value: e.target.value }))}
                />
              </label>

              <label className="sud-field full">
                <span>Email Address</span>
                <input
                  type="email"
                  required
                  placeholder="branch@medbits.com"
                  value={branchForm.email}
                  onChange={(e) => dispatch(updateBranchFormField({ field: 'email', value: e.target.value }))}
                />
              </label>
            </div>

            <button type="submit" className="sud-btn" disabled={isCreatingBranch}>
              {isCreatingBranch ? 'Creating...' : 'Create Branch'}
            </button>
          </form>
        </div>

        {/* Panel 2: Assign Branch Admin */}
        <div className="sud-card">
          <div className="sud-card-header">
            <div>
              <h2>Assign Branch Admin</h2>
              <p>Create a branch administrator account and link to an unassigned branch.</p>
            </div>
          </div>

          <form onSubmit={handleAssignAdmin} className="sud-form">
            <label className="sud-field">
              <span>Select Branch</span>
              <select
                required
                value={adminForm.branchId}
                onChange={(e) => dispatch(updateAdminFormField({ field: 'branchId', value: e.target.value }))}
                disabled={unassignedBranches.length === 0}
              >
                <option value="">
                  {unassignedBranches.length === 0
                    ? 'No unassigned branches available'
                    : 'Choose an unassigned branch...'}
                </option>
                {unassignedBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branchName} · {b.city || '-'} ({b.hospitalName || 'MedBits'})
                  </option>
                ))}
              </select>
            </label>

            <div className="sud-form-grid">
              <label className="sud-field">
                <span>Admin Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={adminForm.name}
                  onChange={(e) => dispatch(updateAdminFormField({ field: 'name', value: e.target.value }))}
                />
              </label>

              <label className="sud-field">
                <span>Email Address</span>
                <input
                  type="email"
                  required
                  placeholder="admin@medbits.com"
                  value={adminForm.email}
                  onChange={(e) => dispatch(updateAdminFormField({ field: 'email', value: e.target.value }))}
                />
              </label>

              <label className="sud-field">
                <span>Phone Number</span>
                <input
                  type="text"
                  required
                  maxLength={20}
                  placeholder="+91 98765 43210"
                  value={adminForm.phone}
                  onChange={(e) => dispatch(updateAdminFormField({ field: 'phone', value: e.target.value }))}
                />
              </label>

              <label className="sud-field">
                <span>Password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  value={adminForm.password}
                  onChange={(e) => dispatch(updateAdminFormField({ field: 'password', value: e.target.value }))}
                />
              </label>
            </div>

            <button
              type="submit"
              className="sud-btn"
              disabled={unassignedBranches.length === 0 || isAssigningAdmin}
            >
              {isAssigningAdmin ? 'Creating...' : 'Create Branch Admin'}
            </button>
          </form>
        </div>

      </div>

      {/* Live Branch Registry Table */}
      <div className="sud-card">
        <div className="sud-card-header">
          <div>
            <h2>Live Branch Registry</h2>
            <p>All registered hospital branches and assigned administrators.</p>
          </div>

          {/* Table Search Filter */}
          <div className="sud-search-box">
            <span className="sud-search-icon">🔍</span>
            <input
              type="search"
              className="sud-search-input"
              placeholder="Search by branch, city, state, or admin..."
              value={searchQuery}
              onChange={(e) => dispatch(setDashboardSearchQuery(e.target.value))}
            />
          </div>
        </div>

        {/* Branch Table */}
        <div className="sud-table-wrap">
          <table className="sud-table">
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>City</th>
                <th>State</th>
                <th>Status</th>
                <th>Branch Admin</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="sud-empty-cell">
                    Loading branch records...
                  </td>
                </tr>
              ) : filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="sud-empty-cell">
                    No branches match your search query.
                  </td>
                </tr>
              ) : (
                filteredBranches.map((branch) => {
                  const isActive = String(branch.status || '').toLowerCase() === 'active';
                  const admin = branch.branchAdmin;

                  return (
                    <tr key={branch.id}>
                      {/* Branch & Hospital Name */}
                      <td>
                        <div className="sud-branch-name">{branch.branchName}</div>
                        <div className="sud-hospital-sub">{branch.hospitalName || 'MedBits Healthcare'}</div>
                      </td>

                      {/* Location */}
                      <td>{branch.city || '—'}</td>
                      <td>{branch.state || '—'}</td>

                      {/* Status Badge */}
                      <td>
                        <span className={`sud-badge ${isActive ? 'active' : 'inactive'}`}>
                          {branch.status || 'Active'}
                        </span>
                      </td>

                      {/* Admin Info */}
                      <td>
                        {admin ? (
                          <div>
                            <div className="sud-admin-name">{admin.name}</div>
                            <div className="sud-admin-meta">{admin.email}</div>
                            {admin.phone && <div className="sud-admin-meta">{admin.phone}</div>}
                          </div>
                        ) : (
                          <span className="sud-badge unassigned">Unassigned</span>
                        )}
                      </td>

                      {/* Action: Open Branch Statistics */}
                      <td>
                        <button
                          type="button"
                          className="sud-view-btn"
                          onClick={() => navigate(`/superuser/branch-statistics?branchId=${encodeURIComponent(branch.id)}`)}
                        >
                          View Stats
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
