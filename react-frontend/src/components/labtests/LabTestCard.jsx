/**
 * LabTestCard.jsx — Reusable Diagnostic Lab Test Card Component
 * ================================================================
 * Location: src/components/labtests/LabTestCard.jsx
 *
 * Displays a detailed diagnostic lab test card for the Patient Portal.
 * Features:
 *  - Comprehensive lab test description with medical markers & instructions
 *  - Category badge, test icon, sample type, and turnaround time tags
 *  - Interactive Quantity Stepper (Increase / Decrease) with boundary limits
 *  - Live unit price and computed subtotal calculation
 *  - Accessible keyboard controls and ARIA attributes
 */

import React, { useState } from 'react';
import './LabTestCard.css';

// Default category to emoji icons mapping
const CATEGORY_ICON_MAP = {
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

// Default sample type and timing metadata helper
function getTestMeta(test) {
  const cat = test?.category || '';
  const name = (test?.name || '').toLowerCase();

  let sample = test?.sampleType || 'Blood Sample';
  let fasting = test?.fastingRequired ?? (name.includes('fasting') || name.includes('sugar') || name.includes('lipid') || cat === 'Diabetes' ? 'Fasting: 10-12 hrs' : 'No Fasting Required');
  let tat = test?.turnaroundTime || (cat === 'Full Body Check Up' ? 'Reports in 24 hrs' : 'Reports in 12-24 hrs');
  let params = test?.parametersCount || (cat === 'Full Body Check Up' ? '60+ Tests' : 'Key Markers');

  return { sample, fasting, tat, params };
}

/**
 * QuantityStepper — Interactive +/- quantity controller
 */
export function QuantityStepper({
  quantity = 0,
  min = 0,
  max = 20,
  onIncrease,
  onDecrease,
  onChange,
  disabled = false,
  testName = 'test',
  className = '',
}) {
  const handleDecrease = (e) => {
    e.stopPropagation();
    if (disabled || quantity <= min) return;
    const nextVal = quantity - 1;
    if (onDecrease) onDecrease(nextVal);
    if (onChange) onChange(nextVal);
  };

  const handleIncrease = (e) => {
    e.stopPropagation();
    if (disabled || quantity >= max) return;
    const nextVal = quantity + 1;
    if (onIncrease) onIncrease(nextVal);
    if (onChange) onChange(nextVal);
  };

  return (
    <div
      className={`labtest-qty-stepper ${className}`.trim()}
      role="group"
      aria-label={`Quantity selector for ${testName}`}
    >
      <button
        type="button"
        className="labtest-qty-btn labtest-qty-btn-minus"
        onClick={handleDecrease}
        disabled={disabled || quantity <= min}
        aria-label={`Decrease quantity of ${testName}`}
        title="Decrease quantity"
      >
        <span aria-hidden="true">&minus;</span>
      </button>

      <span
        className="labtest-qty-value"
        role="status"
        aria-live="polite"
        aria-label={`Current quantity: ${quantity}`}
      >
        {quantity}
      </span>

      <button
        type="button"
        className="labtest-qty-btn labtest-qty-btn-plus"
        onClick={handleIncrease}
        disabled={disabled || quantity >= max}
        aria-label={`Increase quantity of ${testName}`}
        title="Increase quantity"
      >
        <span aria-hidden="true">&#43;</span>
      </button>
    </div>
  );
}

/**
 * LabTestCard — Primary Card Component describing a lab test with quantity controls
 */
export default function LabTestCard({
  test,
  quantity: controlledQuantity,
  initialQuantity = 0,
  min = 0,
  max = 20,
  onQuantityChange,
  onIncrease,
  onDecrease,
  onAdd,
  onRemove,
  showTotal = true,
  disabled = false,
  alwaysShowStepper = false,
  className = '',
}) {
  const [internalQuantity, setInternalQuantity] = useState(initialQuantity);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!test) return null;

  const isControlled = controlledQuantity !== undefined;
  const currentQuantity = isControlled ? controlledQuantity : internalQuantity;

  const testName = test.name || 'Diagnostic Test';
  const category = test.category || 'General Pathology';
  const price = Number(test.price) || 0;
  const description = test.description || 'Comprehensive laboratory diagnostic evaluation performed by certified clinical pathologists.';
  const icon = test.icon || CATEGORY_ICON_MAP[category] || '🧪';
  const meta = getTestMeta(test);
  const totalPrice = price * (currentQuantity > 0 ? currentQuantity : 1);

  const handleUpdate = (nextQty) => {
    if (!isControlled) {
      setInternalQuantity(nextQty);
    }
    if (onQuantityChange) {
      onQuantityChange(nextQty, test);
    }
    if (nextQty === 0 && onRemove) {
      onRemove(test);
    }
  };

  const handleIncrease = (nextQty) => {
    handleUpdate(nextQty);
    if (onIncrease) onIncrease(nextQty, test);
  };

  const handleDecrease = (nextQty) => {
    handleUpdate(nextQty);
    if (onDecrease) onDecrease(nextQty, test);
  };

  const handleInitialAdd = (e) => {
    e.stopPropagation();
    const nextQty = 1;
    handleUpdate(nextQty);
    if (onAdd) onAdd(test);
  };

  return (
    <article
      className={`labtest-card ${currentQuantity > 0 ? 'in-cart' : ''} ${disabled ? 'disabled' : ''} ${className}`.trim()}
      aria-labelledby={`labtest-title-${test.id || testName.replace(/\s+/g, '-')}`}
    >
      {/* ── CARD HEADER: Category, Tags, Icon ─────────────────────── */}
      <div className="labtest-card-top">
        <div className="labtest-badge-wrap">
          <span className="labtest-category-badge">
            <span className="category-dot" aria-hidden="true" />
            {category}
          </span>
          {meta.params && (
            <span className="labtest-pill-badge">{meta.params}</span>
          )}
        </div>
        <div className="labtest-icon-wrapper" aria-hidden="true">
          {icon}
        </div>
      </div>

      {/* ── TEST TITLE & DESCRIPTION ──────────────────────────────── */}
      <div className="labtest-body">
        <h3
          id={`labtest-title-${test.id || testName.replace(/\s+/g, '-')}`}
          className="labtest-title"
        >
          {testName}
        </h3>

        <div className="labtest-description-container">
          <p className={`labtest-description ${isExpanded ? 'expanded' : ''}`}>
            {description}
          </p>
          {description.length > 90 && (
            <button
              type="button"
              className="labtest-expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Show less description' : 'Show full description'}
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* ── CLINICAL META TAGS ──────────────────────────────────── */}
        <div className="labtest-meta-chips">
          <span className="meta-chip" title="Specimen required">
            <span className="meta-chip-icon">🩸</span>
            {meta.sample}
          </span>
          <span className="meta-chip" title="Fasting instructions">
            <span className="meta-chip-icon">⏳</span>
            {meta.fasting}
          </span>
          <span className="meta-chip" title="Report turnaround time">
            <span className="meta-chip-icon">🕒</span>
            {meta.tat}
          </span>
        </div>
      </div>

      {/* ── CARD FOOTER: Pricing & Quantity Controls ──────────────── */}
      <div className="labtest-card-footer">
        <div className="labtest-price-block">
          <span className="labtest-price-label">Price</span>
          <div className="labtest-price-row">
            <span className="labtest-price-value">
              ₹{price.toLocaleString('en-IN')}
            </span>
            {currentQuantity > 1 && showTotal && (
              <span className="labtest-subtotal-tag">
                Total: ₹{(price * currentQuantity).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        <div className="labtest-action-block">
          {currentQuantity === 0 && !alwaysShowStepper ? (
            <button
              type="button"
              className="btn-add-labtest"
              onClick={handleInitialAdd}
              disabled={disabled}
              aria-label={`Add ${testName} to test booking`}
            >
              <span className="btn-add-icon">&#43;</span>
              <span>Add</span>
            </button>
          ) : (
            <div className="labtest-stepper-container">
              <span className="labtest-stepper-label">Qty:</span>
              <QuantityStepper
                quantity={currentQuantity}
                min={min}
                max={max}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                onChange={handleUpdate}
                disabled={disabled}
                testName={testName}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
