/**
 * SpecialityCard.jsx — Reusable Medical Specialty Display Card
 * ==============================================================
 * Location: src/components/appointments/SpecialityCard.jsx
 *
 * Displays a medical specialty in the appointments section with
 * icon, title, active state, and click handler.
 */

import React from 'react';
import './SpecialityCard.css';

// Clinical specialty to icon mapping
const SPECIALTY_ICON_MAP = {
  cardiology: '🫀',
  cardiologist: '🫀',
  heart: '🫀',
  dermatology: '🧴',
  dermatologist: '🧴',
  skin: '🧴',
  pediatrics: '👶',
  pediatrician: '👶',
  paediatrics: '👶',
  orthopedics: '🦴',
  orthopedic: '🦴',
  bone: '🦴',
  gynecology: '🌸',
  gynecologist: '🌸',
  gynaecology: '🌸',
  neurology: '🧠',
  neurologist: '🧠',
  general: '🩺',
  'general medicine': '🩺',
  'general physician': '🩺',
  physician: '🩺',
  ophthalmology: '👁️',
  dentistry: '🦷',
  dentist: '🦷',
  ent: '👂',
  psychiatry: '🧘',
  pulmonology: '🫁',
  radiology: '🩻',
  gastroenterology: '🥗',
  nephrology: '💧',
  oncology: '🎗️',
  urology: '🔬',
};

function getSpecialtyIcon(specialtyName) {
  if (!specialtyName) return '🩺';
  const key = String(specialtyName).trim().toLowerCase();
  if (SPECIALTY_ICON_MAP[key]) return SPECIALTY_ICON_MAP[key];
  for (const [name, icon] of Object.entries(SPECIALTY_ICON_MAP)) {
    if (key.includes(name) || name.includes(key)) return icon;
  }
  return '🩺';
}

export default function SpecialityCard({
  speciality,
  icon,
  count,
  isSelected,
  onClick,
  className = '',
  disabled = false,
}) {
  const title = speciality || 'General Medicine';
  const isCardActive = Boolean(isSelected);
  const resolvedIcon = icon || getSpecialtyIcon(title);

  const handleClick = (e) => {
    if (disabled) return;
    if (onClick) onClick(title, e);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isCardActive}
      aria-label={`Select ${title} specialty`}
      className={`speciality-card cat-card ${isCardActive ? 'active active-cat' : ''} ${disabled ? 'disabled' : ''} ${className}`.trim()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-spec={title}
    >
      <div className="speciality-card-icon cat-icon" aria-hidden="true">
        {resolvedIcon}
      </div>
      <div className="speciality-card-name cat-name">
        {title}
      </div>
      {count !== undefined && count !== null && (
        <span className="speciality-card-count">
          {typeof count === 'number' ? `${count} Doctor${count === 1 ? '' : 's'}` : count}
        </span>
      )}
    </div>
  );
}
