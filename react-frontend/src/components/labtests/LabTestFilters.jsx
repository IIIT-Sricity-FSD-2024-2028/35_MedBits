/**
 * LabTestFilters.jsx — Diagnostic Test Select & Filter Card Component
 * ======================================================================
 * Location: src/components/labtests/LabTestFilters.jsx
 *
 * Provides a dedicated search & filter card for the Lab Tests module:
 *  - Branch selection dropdown with clinical facility indicator
 *  - Real-time search input for tests, biomarkers, and health conditions
 *  - Fasting requirement & price sort filter controls
 *  - Clear and Reset action triggers
 */

import React from 'react';
import './LabTestFilters.css';

export default function LabTestFilters({
  branches = [],
  selectedBranch = '',
  onBranchChange,
  searchQuery = '',
  onSearchChange,
  sortBy = 'default',
  onSortChange,
  fastingFilter = 'all',
  onFastingFilterChange,
  onReset,
  totalResults = 0,
  className = '',
}) {
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    sortBy !== 'default' ||
    fastingFilter !== 'all'
  );

  return (
    <div
      className={`labtest-filters-card card ${className}`.trim()}
      role="search"
      aria-label="Diagnostic Tests Search and Filters"
    >
      <div className="filters-card-header">
        <div className="filters-title-group">
          <span className="filters-icon" aria-hidden="true">🔎</span>
          <div>
            <h3 className="filters-title">Select Branch & Filter Tests</h3>
            <p className="filters-subtitle">
              Choose your diagnostic center, search specific tests or apply clinical filters
            </p>
          </div>
        </div>

        {hasActiveFilters && onReset && (
          <button
            type="button"
            className="btn-reset-filters"
            onClick={onReset}
            aria-label="Reset all search filters"
          >
            Reset Filters
          </button>
        )}
      </div>

      <div className="filters-grid">
        {/* Branch Selection */}
        <div className="filter-field">
          <label htmlFor="labtest-branch-select" className="filter-label">
            Diagnostic Center / Branch
          </label>
          <div className="select-wrap">
            <span className="field-icon" aria-hidden="true">🏥</span>
            <select
              id="labtest-branch-select"
              className="filter-select"
              value={selectedBranch}
              onChange={(e) => onBranchChange && onBranchChange(e.target.value)}
            >
              {branches.length > 0 ? (
                branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branchName || b.name || 'Apollo Main Diagnostic Center'}
                  </option>
                ))
              ) : (
                <option value="00000000-0000-4000-8000-000000000001">
                  Apollo Main Diagnostic Branch (Central Lab)
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="filter-field search-field">
          <label htmlFor="labtest-search-input" className="filter-label">
            Search Diagnostic Tests
          </label>
          <div className="input-wrap">
            <span className="field-icon" aria-hidden="true">🔍</span>
            <input
              id="labtest-search-input"
              type="text"
              className="filter-input"
              placeholder="Search by test name, marker (e.g. HbA1c, CBC, Lipid)..."
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-input-btn"
                onClick={() => onSearchChange && onSearchChange('')}
                aria-label="Clear search input"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Sort By Dropdown */}
        <div className="filter-field sort-field">
          <label htmlFor="labtest-sort-select" className="filter-label">
            Sort Tests By
          </label>
          <div className="select-wrap">
            <span className="field-icon" aria-hidden="true">⇅</span>
            <select
              id="labtest-sort-select"
              className="filter-select"
              value={sortBy}
              onChange={(e) => onSortChange && onSortChange(e.target.value)}
            >
              <option value="default">Default Catalog Order</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Alphabetical (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Quick Chips */}
      <div className="filters-bottom-bar">
        <div className="fasting-chips-group">
          <span className="chips-label">Fasting:</span>
          <button
            type="button"
            className={`filter-chip ${fastingFilter === 'all' ? 'active' : ''}`}
            onClick={() => onFastingFilterChange && onFastingFilterChange('all')}
          >
            All Tests
          </button>
          <button
            type="button"
            className={`filter-chip ${fastingFilter === 'fasting' ? 'active' : ''}`}
            onClick={() => onFastingFilterChange && onFastingFilterChange('fasting')}
          >
            ⏳ Fasting Required
          </button>
          <button
            type="button"
            className={`filter-chip ${fastingFilter === 'no-fasting' ? 'active' : ''}`}
            onClick={() => onFastingFilterChange && onFastingFilterChange('no-fasting')}
          >
            ⚡ No Fasting Needed
          </button>
        </div>

        {totalResults !== undefined && (
          <div className="filters-results-badge">
            Showing <strong>{totalResults}</strong> test{totalResults === 1 ? '' : 's'}
          </div>
        )}
      </div>
    </div>
  );
}
