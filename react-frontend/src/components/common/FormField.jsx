/**
 * FormField.jsx — Universal Form Input & Validation Wrapper Component
 * =========================================================================
 * WHAT THIS COMPONENT DOES:
 *  Standardizes form inputs by bundling:
 *    1. Accessible <label> with required (*) or optional markers.
 *    2. <input> or <select> control with dynamic error border highlighting.
 *    3. Inline validation error message display.
 *
 * WHY IT IS REUSABLE:
 *  - Eliminates the repetitive 20-line JSX pattern for every single form field.
 *  - Guarantees consistent typography, padding, border radius, and error styling
 *    across all hospital forms (walk-ins, appointments, patient intake).
 *
 * PROPS:
 *  @param {string} label       - Field label text (e.g. "First Name")
 *  @param {string} name        - Input/Select HTML name attribute
 *  @param {string} type        - Input type: 'text'|'email'|'tel'|'date'|'select' (default: 'text')
 *  @param {string} value       - Controlled input value
 *  @param {function} onChange  - Change event handler
 *  @param {string} error       - Validation error message (if invalid)
 *  @param {boolean} required   - If true, renders a red asterisk (*)
 *  @param {boolean} optional   - If true, renders "(Optional)"
 *  @param {string} placeholder - Input placeholder text
 *  @param {Array} options      - Array of options for 'select' type: [{ value, label }] or strings
 *  @param {number} maxLength   - Optional maxLength constraint
 *  @param {string} max         - Optional max constraint (e.g. max date)
 *  @param {boolean} disabled   - Disabled state
 *  @param {object} style       - Optional wrapper style overrides
 */

import React from 'react';

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  optional = false,
  placeholder = '',
  options = [],
  maxLength,
  max,
  min,
  disabled = false,
  id = name,
  style = {},
}) {
  const isInvalid = Boolean(error);

  const controlStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: `1px solid ${isInvalid ? '#dc2626' : '#cbd5e1'}`,
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#ffffff',
    color: '#0f172a',
    transition: 'border-color 0.15s ease',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {/* Field Label */}
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 600,
          color: '#334155',
          marginBottom: '6px',
        }}
      >
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
        {optional && (
          <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: '6px' }}>
            (Optional)
          </span>
        )}
      </label>

      {/* Select Control */}
      {type === 'select' ? (
        <select
          id={id}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          style={controlStyle}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>
      ) : (
        /* Input Control */
        <input
          id={id}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          max={max}
          min={min}
          disabled={disabled}
          style={controlStyle}
        />
      )}

      {/* Inline Validation Error Message */}
      {isInvalid && (
        <span
          style={{
            color: '#dc2626',
            fontSize: '12px',
            marginTop: '4px',
            display: 'block',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
