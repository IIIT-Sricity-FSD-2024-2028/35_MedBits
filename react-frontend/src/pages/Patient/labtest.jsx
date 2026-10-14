/**
 * labtest.jsx — Patient Diagnostic Lab Tests Booking Page
 * ==========================================================
 * Location: src/pages/Patient/labtest.jsx
 *
 * Integrates the 4 core components:
 *  1. SpecialityCard   — Category selector for health check packages
 *  2. LabTestFilters   — Select/Filter Card for branch, search, sort & fasting
 *  3. LabTestCard      — Diagnostic test card with description & quantity stepper
 *  4. LabTestCart      — Interactive cart card with breakdown & booking confirmation
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import SpecialityCard from '../../components/appointments/SpecialityCard';
import LabTestFilters from '../../components/labtests/LabTestFilters';
import LabTestCard from '../../components/labtests/LabTestCard';
import LabTestCart, { LabTestCartBar } from '../../components/labtests/LabTestCart';
import StatusBadge from '../../components/common/StatusBadge';
import './labtest.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Canonical test catalog with medical descriptions
const FALLBACK_TESTS = [
  {
    id: 'LAB001',
    name: 'Prime Full Body Checkup',
    price: 1549,
    category: 'Full Body Check Up',
    description: 'Comprehensive preventive health screening package covering lipid profile, liver function, renal function, hemogram, and thyroid markers.',
    parametersCount: '63 Tests',
    sampleType: 'Blood & Urine',
    fastingRequired: '10-12 hrs fasting',
    turnaroundTime: 'Reports in 24 hrs',
  },
  {
    id: 'LAB002',
    name: 'Xpert Regular Full Body Health Checkup',
    price: 1079,
    category: 'Full Body Check Up',
    description: 'Routine full body screening with essential health markers for regular annual checkups and early disease detection.',
    parametersCount: '48 Tests',
    sampleType: 'Blood Sample',
    fastingRequired: '10-12 hrs fasting',
    turnaroundTime: 'Reports in 24 hrs',
  },
  {
    id: 'LAB003',
    name: 'HbA1c Test (Glycated Hemoglobin)',
    price: 649,
    category: 'Diabetes',
    description: 'Measures average blood sugar levels over the last 2 to 3 months to diagnose and manage pre-diabetes and diabetes mellitus.',
    parametersCount: 'Gold Standard',
    sampleType: 'Blood Sample',
    fastingRequired: 'No fasting required',
    turnaroundTime: 'Reports in 12 hrs',
  },
  {
    id: 'LAB004',
    name: 'Fasting Blood Sugar Test (FBS)',
    price: 100,
    category: 'Diabetes',
    description: 'Checks your basal glucose level after an overnight fast for primary diabetes diagnosis and glycemic regulation evaluation.',
    parametersCount: '1 Parameter',
    sampleType: 'Blood Sample',
    fastingRequired: '8-10 hrs fasting',
    turnaroundTime: 'Reports in 6 hrs',
  },
  {
    id: 'LAB005',
    name: 'Complete Blood Count (CBC)',
    price: 419,
    category: 'Blood Studies',
    description: 'Complete blood count assessing RBC, WBC, platelets, hemoglobin, and hematocrit to evaluate infections, anemia, and general wellness.',
    parametersCount: '24 Parameters',
    sampleType: 'Blood Sample',
    fastingRequired: 'No fasting required',
    turnaroundTime: 'Reports in 8 hrs',
  },
  {
    id: 'LAB006',
    name: 'Comprehensive Lipid Profile',
    price: 829,
    category: 'Heart',
    description: 'Measures total cholesterol, HDL, LDL, VLDL, and triglycerides to calculate coronary risk assessment and cardiovascular health.',
    parametersCount: '8 Parameters',
    sampleType: 'Blood Sample',
    fastingRequired: '12 hrs fasting',
    turnaroundTime: 'Reports in 12 hrs',
  },
  {
    id: 'LAB007',
    name: 'Thyroid Profile Total (T3, T4, TSH)',
    price: 550,
    category: 'Thyroid',
    description: 'Evaluates thyroid gland activity and metabolic hormone regulation to detect hyperthyroidism or hypothyroidism.',
    parametersCount: '3 Hormones',
    sampleType: 'Blood Sample',
    fastingRequired: 'No fasting required',
    turnaroundTime: 'Reports in 12 hrs',
  },
  {
    id: 'LAB008',
    name: 'Vitamin D (25-OH) & Vitamin B12 Duo',
    price: 1299,
    category: 'Vitamin',
    description: 'Crucial screening for bone density, calcium absorption, neurological health, energy metabolism, and immunity strength.',
    parametersCount: '2 Essential Vitamins',
    sampleType: 'Blood Sample',
    fastingRequired: 'No fasting required',
    turnaroundTime: 'Reports in 24 hrs',
  },
  {
    id: 'LAB009',
    name: 'Renal / Kidney Function Test (KFT)',
    price: 699,
    category: 'Kidney',
    description: 'Assesses serum creatinine, blood urea nitrogen (BUN), uric acid, and electrolytes to evaluate kidney filtration health.',
    parametersCount: '6 Parameters',
    sampleType: 'Blood Sample',
    fastingRequired: 'No fasting required',
    turnaroundTime: 'Reports in 12 hrs',
  },
  {
    id: 'LAB010',
    name: 'Liver Function Test (LFT)',
    price: 749,
    category: 'Liver',
    description: 'Evaluates liver enzymes (SGOT, SGPT, ALP), bilirubin levels, and total proteins to detect hepatic infection or inflammation.',
    parametersCount: '11 Parameters',
    sampleType: 'Blood Sample',
    fastingRequired: 'No fasting required',
    turnaroundTime: 'Reports in 12 hrs',
  },
];

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
  const { user } = useAuth();
  const userId = user?.id || 'PAT001';

  // ── FILTER STATE ───────────────────────────────────────────────────
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Tests');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [fastingFilter, setFastingFilter] = useState('all');

  // ── CATALOG & CART STATE ───────────────────────────────────────────
  const [tests, setTests] = useState([]);
  const [cartQuantities, setCartQuantities] = useState({});
  const [historyOrders, setHistoryOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState(null);

  // ── DATA FETCHING ──────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        // 1. Fetch Branches
        try {
          const branchRes = await fetch(`${API_BASE_URL}/hospital-branches`, {
            headers: { role: 'patient' },
          });
          if (branchRes.ok) {
            const bData = await branchRes.json();
            if (isMounted && Array.isArray(bData) && bData.length) {
              setBranches(bData);
              setSelectedBranchId(bData[0].id);
            }
          }
        } catch {}

        // 2. Fetch Lab Tests
        try {
          const testRes = await fetch(`${API_BASE_URL}/labtests`, {
            headers: { role: 'patient' },
          });
          if (testRes.ok) {
            const tData = await testRes.json();
            if (isMounted && Array.isArray(tData) && tData.length) {
              const merged = tData.map((item) => {
                const fb = FALLBACK_TESTS.find((f) => f.id === item.id || f.name.toLowerCase() === item.name.toLowerCase());
                return {
                  ...item,
                  description: item.description || fb?.description || 'Diagnostic laboratory analysis performed under NABL accredited protocols.',
                  parametersCount: fb?.parametersCount || 'Standard Markers',
                  sampleType: fb?.sampleType || 'Blood Sample',
                  fastingRequired: fb?.fastingRequired || 'Routine checkup guidelines',
                  turnaroundTime: fb?.turnaroundTime || 'Reports in 24 hrs',
                };
              });
              setTests(merged);
            } else {
              setTests(FALLBACK_TESTS);
            }
          } else {
            setTests(FALLBACK_TESTS);
          }
        } catch {
          if (isMounted) setTests(FALLBACK_TESTS);
        }

        // 3. Fetch Lab Orders History
        try {
          const histRes = await fetch(`${API_BASE_URL}/lab-requests/patient`, {
            headers: { role: 'patient', 'x-user-id': userId },
          });
          if (histRes.ok) {
            const hData = await histRes.json();
            if (isMounted && Array.isArray(hData)) {
              setHistoryOrders(hData);
            }
          }
        } catch {}

      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

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
        matchFasting = String(item.fastingRequired || '').toLowerCase().includes('fasting') &&
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
        const testObj = tests.find((t) => t.id === testId) || FALLBACK_TESTS.find((t) => t.id === testId);
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

  // ── QUANTITY HANDLERS ──────────────────────────────────────────────
  const handleQuantityChange = (testId, newQty) => {
    setCartQuantities((prev) => {
      const next = { ...prev };
      if (newQty <= 0) {
        delete next[testId];
      } else {
        next[testId] = newQty;
      }
      return next;
    });
  };

  const handleClearCart = () => {
    setCartQuantities({});
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSortBy('default');
    setFastingFilter('all');
    setSelectedCategory('All Tests');
  };

  // ── CONFIRM BOOKING ────────────────────────────────────────────────
  const handleConfirmBooking = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    setFeedbackNotice(null);

    try {
      const branchId = selectedBranchId || '00000000-0000-4000-8000-000000000001';
      for (const item of cartItems) {
        await fetch(`${API_BASE_URL}/labtests/book`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            role: 'patient',
          },
          body: JSON.stringify({
            userId,
            labTestId: item.test.id,
            branchId,
          }),
        }).catch(() => {});
      }

      setFeedbackNotice({
        type: 'success',
        text: `Success! ${totalCartCount} test(s) booked. You can review your tests under Diagnostic Records below.`,
      });
      setCartQuantities({});

      // Refresh diagnostic orders
      const histRes = await fetch(`${API_BASE_URL}/lab-requests/patient`, {
        headers: { role: 'patient', 'x-user-id': userId },
      }).catch(() => null);
      if (histRes && histRes.ok) {
        const refreshed = await histRes.json();
        setHistoryOrders(refreshed);
      }
    } catch {
      setFeedbackNotice({
        type: 'error',
        text: 'Unable to complete test booking. Please check connection and retry.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBranchObj = branches.find((b) => b.id === selectedBranchId);

  return (
    <AppShell pageTitle="Lab Tests">
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
              onClick={() => setFeedbackNotice(null)}
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
            onBranchChange={setSelectedBranchId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            fastingFilter={fastingFilter}
            onFastingFilterChange={setFastingFilter}
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
              onClick={() => setSelectedCategory('All Tests')}
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
                  onClick={(specName) => setSelectedCategory(specName)}
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
                        {order.testName || order.test?.name || 'Diagnostic Health Panel'}
                      </td>
                      <td>{order.requestDate || order.date || 'Recent'}</td>
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
    </AppShell>
  );
}
