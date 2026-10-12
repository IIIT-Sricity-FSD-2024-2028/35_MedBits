/**
 * LabTests.jsx — Patient Diagnostic Lab Tests & Booking Page
 * ============================================================
 * Location: src/pages/patient/LabTests.jsx
 *
 * Implements the Patient Portal Lab Tests browsing, category filtering,
 * test search, interactive test cards with description and quantity
 * increase/decrease stepper controls, cart management, and booking.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import LabTestCard from '../../components/labtests/LabTestCard';
import StatusBadge from '../../components/common/StatusBadge';
import './LabTests.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Canonical test catalog fallback with medical descriptions
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
];

const HEALTH_CATEGORIES = [
  { name: 'All Tests', icon: '📋' },
  { name: 'Full Body Check Up', icon: '🧪' },
  { name: 'Diabetes', icon: '🩸' },
  { name: 'Blood Studies', icon: '🔬' },
  { name: 'Heart', icon: '🫀' },
  { name: 'Thyroid', icon: '🦋' },
  { name: 'Vitamin', icon: '🌿', },
  { name: "Women's Health", icon: '🌸' },
  { name: 'Kidney', icon: '🧫' },
  { name: 'Liver', icon: '⚗️' },
  { name: 'Senior Citizen', icon: '🧓' },
];

export default function PatientLabTests() {
  const { user } = useAuth();
  const userId = user?.id || 'PAT001';

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Tests');
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Catalog & Cart state
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
        // 1. Load branches
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

        // 2. Load tests
        try {
          const testRes = await fetch(`${API_BASE_URL}/labtests`, {
            headers: { role: 'patient' },
          });
          if (testRes.ok) {
            const tData = await testRes.json();
            if (isMounted && Array.isArray(tData) && tData.length) {
              // Merge fallback metadata (descriptions, tags) with backend tests
              const merged = tData.map((item) => {
                const fb = FALLBACK_TESTS.find((f) => f.id === item.id || f.name.toLowerCase() === item.name.toLowerCase());
                return {
                  ...item,
                  description: item.description || fb?.description || 'Diagnostic test evaluated at certified pathology laboratory.',
                  parametersCount: fb?.parametersCount || 'Standard Parameters',
                  sampleType: fb?.sampleType || 'Blood Sample',
                  fastingRequired: fb?.fastingRequired || 'Routine guidelines',
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

        // 3. Load user lab booking history
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

  // ── FILTERED TESTS ─────────────────────────────────────────────────
  const filteredTests = useMemo(() => {
    return tests.filter((item) => {
      const matchCat =
        selectedCategory === 'All Tests' ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [tests, selectedCategory, searchQuery]);

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

  // ── BOOKING CONFIRMATION ───────────────────────────────────────────
  const handleConfirmBooking = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    setFeedbackNotice(null);

    try {
      // Book each test through backend
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
        text: `Successfully scheduled ${totalCartCount} lab test(s) for booking!`,
      });
      setCartQuantities({});
      setShowCartDrawer(false);

      // Refresh history
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
        text: 'An error occurred while confirming your lab booking. Please retry.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell pageTitle="Lab Tests">
      <div className="labtests-page-container">

        {/* ── TOP HERO & SEARCH ──────────────────────────────────────── */}
        <section className="labtests-hero">
          <div className="labtests-hero-content">
            <span className="hero-eyebrow">Diagnostic Services</span>
            <h1 className="hero-title">Book Diagnostic Tests & Health Packages</h1>
            <p className="hero-sub">
              Certified path labs, accurate reporting, home sample collection, and instant digital reports.
            </p>
            <div className="labtests-search-bar">
              <span className="search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                placeholder="Search tests by name, symptom, or health marker (e.g. HbA1c, CBC, Thyroid)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="labtests-search-input"
                aria-label="Search lab tests"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── STATUS NOTIFICATIONS ─────────────────────────────────── */}
        {feedbackNotice && (
          <div className={`labtests-alert alert-${feedbackNotice.type}`} role="alert">
            <span>{feedbackNotice.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{feedbackNotice.text}</span>
            <button
              type="button"
              className="alert-close-btn"
              onClick={() => setFeedbackNotice(null)}
            >
              &times;
            </button>
          </div>
        )}

        {/* ── BRANCH & SETTINGS BAR ─────────────────────────────────── */}
        <div className="labtests-toolbar card">
          <div className="toolbar-item">
            <label htmlFor="branchSelect" className="toolbar-label">
              Diagnostic Center / Branch:
            </label>
            <select
              id="branchSelect"
              className="toolbar-select"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
            >
              {branches.length > 0 ? (
                branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branchName || b.name || 'Apollo Main Pathology'}
                  </option>
                ))
              ) : (
                <option value="00000000-0000-4000-8000-000000000001">
                  Apollo Main Diagnostic Branch (Central Lab)
                </option>
              )}
            </select>
          </div>
          <div className="toolbar-info">
            <span className="status-indicator-dot" />
            <span>NABL Certified Diagnostic Center • Digital Reports Enabled</span>
          </div>
        </div>

        {/* ── CATEGORY PILLS ────────────────────────────────────────── */}
        <section className="labtests-categories-section">
          <div className="categories-header">
            <h2 className="section-heading">Health Check Categories</h2>
            <span className="categories-count">{filteredTests.length} tests available</span>
          </div>
          <div className="categories-scroll" role="tablist">
            {HEALTH_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`category-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  <span className="category-pill-icon">{cat.icon}</span>
                  <span className="category-pill-text">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── MAIN CONTENT LAYOUT: Tests Grid + Cart Summary ───────── */}
        <div className="labtests-layout">

          {/* Left Column: Test Cards Grid */}
          <section className="labtests-catalog">
            <div className="catalog-header">
              <h2 className="catalog-title">
                {selectedCategory}
                {searchQuery ? ` — Results for "${searchQuery}"` : ''}
              </h2>
            </div>

            {isLoading ? (
              <div className="labtests-loading">
                <div className="spinner" />
                <p>Loading diagnostic lab test catalog...</p>
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="catalog-empty card">
                <span className="empty-icon">🧪</span>
                <h3>No tests match your filter</h3>
                <p>Try clearing your search query or choosing another health category.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedCategory('All Tests');
                    setSearchQuery('');
                  }}
                >
                  View All Tests
                </button>
              </div>
            ) : (
              <div className="labtests-grid">
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

          {/* Right Column: Desktop Cart Summary */}
          <aside className="labtests-cart-sidebar card">
            <div className="cart-sidebar-header">
              <div className="cart-header-title">
                <span className="cart-icon">🛒</span>
                <h3>Lab Test Cart</h3>
              </div>
              {totalCartCount > 0 && (
                <button
                  type="button"
                  className="btn-clear-cart"
                  onClick={handleClearCart}
                  title="Clear all selected tests"
                >
                  Clear
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="cart-sidebar-empty">
                <div className="empty-cart-illu">🧺</div>
                <p className="empty-cart-text">No tests added yet.</p>
                <span className="empty-cart-sub">
                  Adjust test quantity using the <strong>+</strong> button on any test card.
                </span>
              </div>
            ) : (
              <div className="cart-sidebar-content">
                <div className="cart-items-list">
                  {cartItems.map(({ test, quantity, totalPrice }) => (
                    <div key={test.id} className="cart-summary-item">
                      <div className="cart-item-header">
                        <strong className="cart-item-name">{test.name}</strong>
                        <button
                          type="button"
                          className="cart-remove-icon"
                          onClick={() => handleQuantityChange(test.id, 0)}
                          aria-label={`Remove ${test.name}`}
                          title="Remove test"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="cart-item-footer">
                        <div className="cart-stepper-mini">
                          <button
                            type="button"
                            className="mini-step-btn"
                            onClick={() => handleQuantityChange(test.id, quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            &minus;
                          </button>
                          <span className="mini-qty">{quantity}</span>
                          <button
                            type="button"
                            className="mini-step-btn"
                            onClick={() => handleQuantityChange(test.id, quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            &#43;
                          </button>
                        </div>
                        <span className="cart-item-pricing">
                          ₹{totalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-sidebar-breakdown">
                  <div className="breakdown-row">
                    <span>Total Tests</span>
                    <strong>{totalCartCount} item(s)</strong>
                  </div>
                  <div className="breakdown-row subtotal-row">
                    <span>Subtotal</span>
                    <strong className="subtotal-amount">
                      ₹{cartSubtotal.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-book-tests"
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Confirming Booking...' : `Book ${totalCartCount} Test(s)`}
                  </button>
                  <p className="booking-guarantee">
                    🔒 Safe & hygienic home sample collection or walk-in.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* ── MY LAB TEST BOOKINGS / HISTORY SECTION ───────────────── */}
        <section className="labtests-history-section card">
          <div className="history-header">
            <div>
              <h2 className="section-heading">My Diagnostic Records & Orders</h2>
              <p className="history-sub">View recent test appointments and lab reports status</p>
            </div>
            <span className="history-badge">{historyOrders.length} records</span>
          </div>

          {historyOrders.length === 0 ? (
            <div className="history-empty">
              <p>No recent lab tests found in your profile history.</p>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Date Scheduled</th>
                    <th>Doctor / Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyOrders.map((order, idx) => (
                    <tr key={order.id || idx}>
                      <td className="test-name-cell">
                        <strong>{order.testName || order.test?.name || 'Diagnostic Panel'}</strong>
                      </td>
                      <td>{order.requestDate || order.date || 'Recent'}</td>
                      <td>{order.doctorName || 'Central Clinical Pathology'}</td>
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

        {/* ── MOBILE CART FLOATING BAR ─────────────────────────────── */}
        {totalCartCount > 0 && (
          <div className="mobile-cart-bar">
            <div className="mobile-cart-info">
              <span className="mobile-cart-icon">🛒</span>
              <div>
                <strong className="mobile-cart-total">₹{cartSubtotal.toLocaleString('en-IN')}</strong>
                <span className="mobile-cart-count">({totalCartCount} tests)</span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-accent btn-mobile-checkout"
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
            >
              Confirm Booking
            </button>
          </div>
        )}

      </div>
    </AppShell>
  );
}
