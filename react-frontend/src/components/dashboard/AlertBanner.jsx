/**
 * AlertBanner.jsx — Universal Notification & Error Alert Component
 * =========================================================================
 * WHAT THIS COMPONENT DOES:
 *  Displays standardized, accessible alert boxes for backend errors, warnings,
 *  validation alerts, or confirmation notices.
 *
 * WHY IT IS REUSABLE:
 *  - Both the Dashboard and Registration pages previously duplicated 40+ lines
 *    of inline-styled alert boxes.
 *  - Supports customizable alert types (error, warning, success, info) with
 *    built-in icons, colors, and optional "Retry" and "Dismiss" buttons.
 *
 * PROPS:
 *  @param {'error'|'warning'|'success'|'info'} type - Visual styling theme (default: 'error')
 *  @param {string} title       - Bold heading text (e.g. "Backend Connection Issue")
 *  @param {string} message     - Explanatory message text
 *  @param {function} onRetry   - Optional callback function to render a Retry button
 *  @param {boolean} isRetrying - Disables retry button and shows loading text
 *  @param {string} retryLabel  - Custom text for retry button (default: "Retry")
 *  @param {function} onDismiss - Optional callback function to render a dismiss (✕) button
 *  @param {object} style       - Optional inline style overrides
 */

import React from 'react';

const THEMES = {
  error: {
    bg: '#fef2f2',
    border: '#fecaca',
    titleColor: '#991b1b',
    textColor: '#b91c1c',
    icon: '⚠️',
    buttonBg: '#dc2626',
    buttonHover: '#b91c1c',
  },
  warning: {
    bg: '#fffbeb',
    border: '#fde68a',
    titleColor: '#92400e',
    textColor: '#b45309',
    icon: '⚠️',
    buttonBg: '#d97706',
    buttonHover: '#b45309',
  },
  success: {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    titleColor: '#166534',
    textColor: '#15803d',
    icon: '✅',
    buttonBg: '#16a34a',
    buttonHover: '#15803d',
  },
  info: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    titleColor: '#1e40af',
    textColor: '#1d4ed8',
    icon: 'ℹ️',
    buttonBg: '#2563eb',
    buttonHover: '#1d4ed8',
  },
};

export default function AlertBanner({
  type = 'error',
  title,
  message,
  onRetry,
  isRetrying = false,
  retryLabel = 'Retry Connection',
  onDismiss,
  style = {},
}) {
  const theme = THEMES[type] || THEMES.error;

  return (
    <div
      role="alert"
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <span style={{ fontSize: '20px', flexShrink: 0 }}>{theme.icon}</span>
        <div>
          {title && (
            <strong
              style={{
                color: theme.titleColor,
                display: 'block',
                fontSize: '14px',
                marginBottom: '2px',
              }}
            >
              {title}
            </strong>
          )}
          {message && (
            <span style={{ color: theme.textColor, fontSize: '13px', lineHeight: 1.4 }}>
              {message}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            style={{
              background: theme.buttonBg,
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isRetrying ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.15s ease',
              opacity: isRetrying ? 0.7 : 1,
            }}
          >
            {isRetrying ? 'Connecting...' : retryLabel}
          </button>
        )}

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.textColor,
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
            }}
            title="Dismiss message"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
