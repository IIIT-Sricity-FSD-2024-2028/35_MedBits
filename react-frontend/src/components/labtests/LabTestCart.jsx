/**
 * LabTestCart.jsx — Diagnostic Lab Test Cart Component
 * =======================================================
 * Location: src/components/labtests/LabTestCart.jsx
 *
 * Dedicated, reusable Cart component for the Lab Tests module.
 * Replaces inline cart markup across pages with a rich, interactive,
 * accessible cart supporting:
 *  - Dynamic item breakdown with quantity increment/decrement controls
 *  - Branch routing display matching MedBits clinical workflow
 *  - Price breakdown: subtotal, taxes/service fee (free home collection badge)
 *  - Empty state with informative call-to-action
 *  - Multiple variants: 'sidebar' | 'card' | 'drawer'
 *  - Sticky/floating mobile Cart Bar subcomponent
 */

import React from 'react';
import { QuantityStepper } from './LabTestCard';
import './LabTestCart.css';

// Default category icons
const CATEGORY_ICONS = {
  'Full Body Check Up': '🧪',
  'Full Body': '🧪',
  Diabetes: '🩸',
  'Blood Studies': '🔬',
  Heart: '🫀',
  Kidney: '🧫',
  Liver: '⚗️',
  Thyroid: '🦋',
  Vitamin: '🌿',
  "Women's Health": '🌸',
  'Senior Citizen': '🧓',
};

/**
 * LabTestCartBar — Floating/Sticky Bar indicating cart state on mobile & responsive views
 */
export function LabTestCartBar({
  count = 0,
  total = 0,
  onViewCart,
  onCheckout,
  isSubmitting = false,
  className = '',
}) {
  if (count <= 0) return null;

  return (
    <aside
      className={`labtest-floating-cart-bar ${className}`.trim()}
      role="region"
      aria-label="Active Lab Cart Bar"
    >
      <div className="floating-cart-info" onClick={onViewCart} role="button" tabIndex={0}>
        <div className="floating-cart-icon" aria-hidden="true">🛒</div>
        <div className="floating-cart-text">
          <span className="floating-cart-total">₹{total.toLocaleString('en-IN')}</span>
          <span className="floating-cart-count">
            {count} {count === 1 ? 'test' : 'tests'} selected
          </span>
        </div>
      </div>

      <div className="floating-cart-actions">
        {onViewCart && (
          <button
            type="button"
            className="btn-floating-view"
            onClick={onViewCart}
            aria-label="View Lab Cart Details"
          >
            View Cart
          </button>
        )}
        {onCheckout && (
          <button
            type="button"
            className="btn-floating-checkout"
            onClick={onCheckout}
            disabled={isSubmitting}
            aria-label="Confirm booking for selected lab tests"
          >
            {isSubmitting ? 'Booking...' : 'Book Tests'}
          </button>
        )}
      </div>
    </aside>
  );
}

/**
 * LabTestCart — Primary Cart Component for Lab Tests Module
 */
export default function LabTestCart({
  items = [],
  branchName = 'Apollo Main Diagnostic Branch',
  branchCity = '',
  onQuantityChange,
  onIncrease,
  onDecrease,
  onRemoveItem,
  onClearCart,
  onConfirmBooking,
  onClose,
  isSubmitting = false,
  variant = 'sidebar', // 'sidebar' | 'card' | 'drawer'
  className = '',
}) {
  // Normalize items array
  const cartItems = (items || []).filter((item) => (item.quantity ?? 0) > 0);

  // Compute totals
  const totalCount = cartItems.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  const subtotal = cartItems.reduce(
    (acc, curr) => acc + (curr.totalPrice ?? (curr.test?.price || 0) * (curr.quantity || 1)),
    0
  );

  const handleDecrease = (item) => {
    const testId = item.test?.id || item.id;
    const nextQty = (item.quantity || 1) - 1;
    if (onDecrease) onDecrease(testId, nextQty);
    if (onQuantityChange) onQuantityChange(testId, nextQty);
    if (nextQty <= 0 && onRemoveItem) onRemoveItem(testId);
  };

  const handleIncrease = (item) => {
    const testId = item.test?.id || item.id;
    const nextQty = (item.quantity || 1) + 1;
    if (onIncrease) onIncrease(testId, nextQty);
    if (onQuantityChange) onQuantityChange(testId, nextQty);
  };

  const handleRemove = (item) => {
    const testId = item.test?.id || item.id;
    if (onRemoveItem) onRemoveItem(testId);
    if (onQuantityChange) onQuantityChange(testId, 0);
  };

  return (
    <div
      className={`labtest-cart-component labtest-cart-variant-${variant} ${className}`.trim()}
      aria-label="Diagnostic Lab Test Cart"
    >
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="labtest-cart-header">
        <div className="cart-header-title-wrap">
          <span className="cart-header-icon" aria-hidden="true">🛒</span>
          <div>
            <h3 className="cart-header-title">Your Lab Cart</h3>
            {totalCount > 0 && (
              <span className="cart-header-count">
                {totalCount} {totalCount === 1 ? 'test' : 'tests'} selected
              </span>
            )}
          </div>
        </div>

        <div className="cart-header-actions">
          {totalCount > 0 && onClearCart && (
            <button
              type="button"
              className="btn-clear-cart"
              onClick={onClearCart}
              title="Clear all tests from cart"
            >
              Clear All
            </button>
          )}
          {onClose && (
            <button
              type="button"
              className="btn-close-cart"
              onClick={onClose}
              aria-label="Close cart view"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* ── BRANCH ROUTING NOTICE ───────────────────────────────── */}
      <div className="cart-branch-banner">
        <span className="branch-pin" aria-hidden="true">📍</span>
        <div className="branch-info">
          <span className="branch-label">Fulfillment Center:</span>
          <strong className="branch-name">
            {branchName}{branchCity ? `, ${branchCity}` : ''}
          </strong>
        </div>
      </div>

      {/* ── CART BODY: ITEMS LIST OR EMPTY STATE ────────────────── */}
      <div className="labtest-cart-body">
        {totalCount === 0 ? (
          <div className="cart-empty-state">
            <div className="empty-cart-illu" aria-hidden="true">🧪</div>
            <h4 className="empty-cart-title">Your lab cart is empty</h4>
            <p className="empty-cart-desc">
              Browse the health packages and click <strong>Add</strong> or increase test quantity to prepare your diagnostic booking.
            </p>
          </div>
        ) : (
          <div className="cart-items-container" role="list">
            {cartItems.map((item) => {
              const test = item.test || item;
              const testId = test.id;
              const testName = test.name || 'Diagnostic Test';
              const category = test.category || 'General';
              const unitPrice = Number(test.price) || 0;
              const quantity = item.quantity || 1;
              const itemTotal = item.totalPrice ?? unitPrice * quantity;
              const icon = test.icon || CATEGORY_ICONS[category] || '🔬';

              return (
                <div
                  key={testId}
                  className="cart-item-row"
                  role="listitem"
                >
                  <div className="cart-item-info-group">
                    <div className="cart-item-cat-icon" aria-hidden="true">
                      {icon}
                    </div>
                    <div className="cart-item-details">
                      <h4 className="cart-item-title">{testName}</h4>
                      <div className="cart-item-submeta">
                        <span className="cart-item-category">{category}</span>
                        <span className="cart-item-unit-price">
                          @ ₹{unitPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cart-item-remove-btn"
                      onClick={() => handleRemove(item)}
                      aria-label={`Remove ${testName} from cart`}
                      title="Remove item"
                    >
                      &times;
                    </button>
                  </div>

                  <div className="cart-item-bottom-group">
                    <div className="cart-stepper-wrapper">
                      <QuantityStepper
                        quantity={quantity}
                        min={1}
                        max={20}
                        onDecrease={() => handleDecrease(item)}
                        onIncrease={() => handleIncrease(item)}
                        testName={testName}
                        className="stepper-compact"
                      />
                    </div>

                    <div className="cart-item-price-column">
                      <span className="cart-item-line-total">
                        ₹{itemTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER: SUMMARY & BOOKING BUTTON ───────────────────── */}
      {totalCount > 0 && (
        <div className="labtest-cart-footer">
          <div className="cart-summary-breakdown">
            <div className="summary-line">
              <span>Tests Selected</span>
              <span>{totalCount} item(s)</span>
            </div>
            <div className="summary-line">
              <span>Sample Collection</span>
              <span className="badge-free-collection">FREE</span>
            </div>
            <div className="summary-line summary-subtotal-line">
              <span>Estimated Subtotal</span>
              <strong className="summary-subtotal-value">
                ₹{subtotal.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="btn-confirm-lab-booking"
            onClick={onConfirmBooking}
            disabled={isSubmitting || totalCount === 0}
            aria-label="Confirm diagnostic lab test booking"
          >
            {isSubmitting ? (
              <span className="btn-loading-inline">
                <span className="spinner-mini" aria-hidden="true" />
                Scheduling Order...
              </span>
            ) : (
              <span>Confirm & Book {totalCount} Test(s)</span>
            )}
          </button>

          <div className="cart-compliance-badge">
            <span aria-hidden="true">🛡️</span>
            <span>NABL & ICMR accredited laboratories • Digital reports delivered online</span>
          </div>
        </div>
      )}
    </div>
  );
}
