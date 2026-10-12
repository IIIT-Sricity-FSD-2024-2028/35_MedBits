/**
 * Modal.jsx — Universal Accessible Modal Dialog Component
 * =========================================================================
 * WHAT THIS COMPONENT DOES:
 *  Provides a standardized dialog popup overlay with:
 *    1. Backdrop overlay with soft blur and dismiss on click outside.
 *    2. Escape key listener for keyboard accessibility.
 *    3. Header with title, optional subtitle, and close (×) button.
 *    4. Scrollable content body with proper padding.
 *    5. Optional action footer.
 *
 * WHY IT IS REUSABLE:
 *  - Eliminates duplicated modal boilerplate markup across all modules.
 *  - Enforces consistent styling, border radiuses, and shadow depth.
 *
 * PROPS:
 *  @param {boolean} isOpen       - Whether the modal is currently visible
 *  @param {function} onClose     - Callback invoked when modal is dismissed
 *  @param {string} title         - Main title string in header
 *  @param {string} subtitle      - Optional helper subtitle
 *  @param {ReactNode} children   - Body content of the modal
 *  @param {ReactNode} footer     - Optional footer actions (buttons)
 *  @param {string} maxWidth      - Optional custom max-width (default: '580px')
 */

import React, { useEffect } from 'react';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '580px',
}) {
  // Listen for 'Escape' key to close modal gracefully
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000,
        animation: 'fadeIn 0.18s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: `min(${maxWidth}, 100%)`,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.25), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            backgroundColor: '#ffffff',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
                color: '#0f172a',
                fontFamily: 'Sora, sans-serif',
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '13px',
                  color: '#64748b',
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              lineHeight: 1,
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#0f172a';
              e.currentTarget.style.backgroundColor = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            &times;
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            color: '#0f172a',
          }}
        >
          {children}
        </div>

        {/* Optional Modal Footer */}
        {footer && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#f8fafc',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
