/**
 * labtest.jsx — Patient Diagnostic Lab Tests Booking Page
 * ==========================================================
 * Location: src/pages/Patient/labtest.jsx
 *
 * Powered by Redux Toolkit (`patientLabTestsSlice` + `authSlice`).
 * Integrates the 4 core components:
 *  1. SpecialityCard   — Category selector for health check packages
 *  2. LabTestFilters   — Select/Filter Card for branch, search, sort & fasting
 *  3. LabTestCard      — Diagnostic test card with description & quantity stepper
 *  4. LabTestCart      — Interactive cart card with breakdown & booking confirmation
 */

import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  FALLBACK_TESTS,
  fetchLabBranches,
  fetchLabTests,
  fetchDiagnosticHistory,
  confirmLabTestBooking,
  setSelectedBranchId,
  setSelectedCategory,
  setSearchQuery,
  setSortBy,
  setFastingFilter,
  resetLabTestFilters,
  setTestQuantity,
  clearLabCart,
  clearLabTestNotice,
  selectLabBranches,
  selectLabTests,
  selectLabHistoryOrders,
  selectSelectedLabBranchId,
  selectSelectedLabCategory,
  selectLabSearchQuery,
  selectLabSortBy,
  selectLabFastingFilter,
  selectLabCartQuantities,
  selectLabTestsStatus,
  selectIsSubmittingLabBooking,
  selectLabFeedbackNotice,
} from '../../store/slices/patient/patientLabTestsSlice';
import SpecialityCard from '../../components/appointments/SpecialityCard';
import LabTestFilters from '../../components/labtests/LabTestFilters';
import LabTestCard from '../../components/labtests/LabTestCard';
import LabTestCart, { LabTestCartBar } from '../../components/labtests/LabTestCart';
import StatusBadge from '../../components/common/StatusBadge';
import './labtest.css';

const HEALTH_CATEGORIES = [
  { name: 'All Tests', icon: '📋' },
  { name: 'Full Body Check Up', icon: '🧪' },
  { name: 'Diabetes', icon: '🩸' },
  { name: 'Blood Studies', icon: '🔬' },
  { name: 'Heart', icon: '🫀' },
  { name: 'Thyroid', icon: '🦋' },
  { name: 'Vitamin', icon: '🌿' },
  { name: 'Kidney', icon: '🧫' },
  { name: 'Liver', icon: '⚗️' },
  { name: "Women's Health", icon: '🌸' },
  { name: 'Senior Citizen', icon: '🧓' },
];

export default function PatientLabTest() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const userId = user?.id || 'PAT001';

  const branches = useSelector(selectLabBranches);
  const selectedBranchId = useSelector(selectSelectedLabBranchId);
  const selectedCategory = useSelector(selectSelectedLabCategory);
  const searchQuery = useSelector(selectLabSearchQuery);
  const sortBy = useSelector(selectLabSortBy);
  const fastingFilter = useSelector(selectLabFastingFilter);

  const tests = useSelector(selectLabTests);
  const cartQuantities = useSelector(selectLabCartQuantities);
  const historyOrders = useSelector(selectLabHistoryOrders);
  const testsStatus = useSelector(selectLabTestsStatus);
  const isSubmitting = useSelector(selectIsSubmittingLabBooking);
  const feedbackNotice = useSelector(selectLabFeedbackNotice);

  const isLoading = testsStatus === 'loading';

  // ── INITIAL LOAD & CLEANUP ─────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchLabBranches());
    dispatch(fetchLabTests());
    return () => {
      dispatch(clearLabTestNotice());
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchDiagnosticHistory(userId));
  }, [dispatch, userId]);

  // ── CATEGORY TEST COUNTS ───────────────────────────────────────────
  const categoryCounts = useMemo(() => {
    const counts = { 'All Tests': tests.length };
    tests.forEach((t) => {
      const cat = t.category;
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return counts;
  }, [tests]);

  // ── FILTERED & SORTED TESTS ────────────────────────────────────────
  const filteredTests = useMemo(() => {
    let result = tests.filter((item) => {
      // Category filter
      const matchCategory =
        selectedCategory === 'All Tests' ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();

      // Search query filter
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query);

      // Fasting filter
      let matchFasting = true;
      if (fastingFilter === 'fasting') {
        matchFasting =
          String(item.fastingRequired || '').toLowerCase().includes('fasting') &&
          !String(item.fastingRequired || '').toLowerCase().includes('no fasting');
      } else if (fastingFilter === 'no-fasting') {
        matchFasting = String(item.fastingRequired || '').toLowerCase().includes('no fasting');
      }

      return matchCategory && matchSearch && matchFasting;
    });

    // Sorting
    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [tests, selectedCategory, searchQuery, fastingFilter, sortBy]);

  // ── CART COMPUTATIONS ──────────────────────────────────────────────
  const cartItems = useMemo(() => {
    return Object.entries(cartQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([testId, qty]) => {
        const testObj =
          tests.find((t) => t.id === testId) || FALLBACK_TESTS.find((t) => t.id === testId);
        return {
          test: testObj,
          quantity: qty,
          totalPrice: (testObj?.price || 0) * qty,
        };
      })
      .filter((item) => Boolean(item.test));
  }, [cartQuantities, tests]);

  const totalCartCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

  // ── QUANTITY & BOOKING HANDLERS ────────────────────────────────────
  const handleQuantityChange = (testId, newQty) => {
    dispatch(setTestQuantity({ testId, quantity: newQty }));
  };

  const handleClearCart = () => {
    dispatch(clearLabCart());
  };

  const handleResetFilters = () => {
    dispatch(resetLabTestFilters());
  };

  const handleConfirmBooking = () => {
    if (cartItems.length === 0) return;
    dispatch(confirmLabTestBooking());
  };

  const selectedBranchObj = branches.find((b) => b.id === selectedBranchId);

  return (
      <div className="labtest-page-container">

        {/* ── TOP HERO BANNER ────────────────────────────────────────── */}
        <section className="labtest-hero">
          <div className="labtest-hero-text">
            <span className="hero-tag">Certified Pathology</span>
            <h1 className="hero-heading">Comprehensive Diagnostic Lab Tests</h1>
            <p className="hero-subtext">
              Book routine checkups, specialized diagnostic profiles, and preventive wellness packages with digital reports.
            </p>
          </div>
        </section>

        {/* ── FEEDBACK ALERTS ──────────────────────────────────────── */}
        {feedbackNotice && (
          <div className={`labtest-alert alert-${feedbackNotice.type}`} role="alert">
            <span>{feedbackNotice.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{feedbackNotice.text}</span>
            <button
              type="button"
              className="alert-dismiss"
              onClick={() => dispatch(clearLabTestNotice())}
            >
              &times;
            </button>
          </div>
        )}

        {/* ── COMPONENT 1: SELECT / FILTER CARD (LabTestFilters) ───── */}
        <section className="labtest-filters-section">
          <LabTestFilters
            branches={branches}
            selectedBranch={selectedBranchId}
            onBranchChange={(branchId) => dispatch(setSelectedBranchId(branchId))}
            searchQuery={searchQuery}
            onSearchChange={(query) => dispatch(setSearchQuery(query))}
            sortBy={sortBy}
            onSortChange={(sort) => dispatch(setSortBy(sort))}
            fastingFilter={fastingFilter}
            onFastingFilterChange={(fasting) => dispatch(setFastingFilter(fasting))}
            onReset={handleResetFilters}
            totalResults={filteredTests.length}
          />
        </section>

        {/* ── COMPONENT 2: SPECIALITYCARD (Health Check Categories) ── */}
        <section className="labtest-specialties-section card">
          <div className="specialties-section-header">
            <div>
              <h2 className="section-title">Health Check Categories</h2>
              <p className="section-subtitle">
                Select a medical specialty or preventive health category to filter tests
              </p>
            </div>
            <button
              type="button"
              className="btn-view-all-categories"
              onClick={() => dispatch(setSelectedCategory('All Tests'))}
            >
              View All ({tests.length})
            </button>
          </div>

          <div className="specialities-grid">
            {HEALTH_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              const count = categoryCounts[cat.name] || 0;

              return (
                <SpecialityCard
                  key={cat.name}
                  speciality={cat.name}
                  icon={cat.icon}
                  count={`${count} Test${count === 1 ? '' : 's'}`}
                  isSelected={isSelected}
                  onClick={(specName) => dispatch(setSelectedCategory(specName))}
                  className="lab-speciality-card"
                />
              );
            })}
          </div>
        </section>

        {/* ── MAIN TWO-COLUMN CONTENT AREA ─────────────────────────── */}
        <div className="labtest-main-grid">

          {/* ── COMPONENT 3: LABTEST CARD (Catalog List) ───────────── */}
          <section className="labtest-cards-column">
            <div className="catalog-header-bar">
              <h2 className="catalog-active-title">
                {selectedCategory}
                {searchQuery ? ` • Search: "${searchQuery}"` : ''}
              </h2>
              <span className="catalog-counter">
                {filteredTests.length} Available
              </span>
            </div>

            {isLoading ? (
              <div className="labtest-loading-state">
                <div className="labtest-spinner" />
                <p>Loading diagnostic tests...</p>
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="catalog-no-results card">
                <span className="no-results-icon">🔬</span>
                <h3>No lab tests found</h3>
                <p>No tests match your selected criteria. Try resetting your search filters.</p>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleResetFilters}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="labtest-cards-grid">
                {filteredTests.map((test) => (
                  <LabTestCard
                    key={test.id}
                    test={test}
                    quantity={cartQuantities[test.id] || 0}
                    onQuantityChange={(qty) => handleQuantityChange(test.id, qty)}
                    showTotal={true}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── COMPONENT 4: LABTEST CART CARD (LabTestCart) ───────── */}
          <aside className="labtest-cart-column">
            <LabTestCart
              items={cartItems}
              branchName={selectedBranchObj?.branchName || selectedBranchObj?.name || 'Apollo Main Diagnostic Branch'}
              branchCity={selectedBranchObj?.city || 'Central Lab'}
              onQuantityChange={handleQuantityChange}
              onClearCart={handleClearCart}
              onConfirmBooking={handleConfirmBooking}
              isSubmitting={isSubmitting}
              variant="sidebar"
            />
          </aside>
        </div>

        {/* ── MY LAB TEST BOOKINGS / DIAGNOSTIC RECORDS ────────────── */}
        <section className="labtest-history-card card">
          <div className="history-header">
            <div>
              <h2 className="section-title">My Diagnostic Records & Reports</h2>
              <p className="section-subtitle">Track your scheduled diagnostic bookings and report readiness</p>
            </div>
            <span className="history-counter-badge">{historyOrders.length} records</span>
          </div>

          {historyOrders.length === 0 ? (
            <div className="history-empty-message">
              <p>No recent diagnostic orders on record for your patient profile.</p>
            </div>
          ) : (
            <div className="history-table-container">
              <table className="labtest-history-table">
                <thead>
                  <tr>
                    <th>Test / Package Name</th>
                    <th>Date Scheduled</th>
                    <th>Laboratory / Doctor</th>
                    <th>Report Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyOrders.map((order, idx) => (
                    <tr key={order.id || idx}>
                      <td className="test-name-bold">
                        {order.testName || order.labTest?.name || order.test?.name || 'Diagnostic Health Panel'}
                      </td>
                      <td>{order.requestDate || order.date || (order.createdAt ? order.createdAt.split('T')[0] : 'Recent')}</td>
                      <td>{order.doctorName || 'Central Pathology Department'}</td>
                      <td>
                        <StatusBadge status={order.status || 'Pending'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── MOBILE CART BAR SUBCOMPONENT ─────────────────────────── */}
        <LabTestCartBar
          count={totalCartCount}
          total={cartSubtotal}
          onCheckout={handleConfirmBooking}
          isSubmitting={isSubmitting}
        />

      </div>
  );
}
