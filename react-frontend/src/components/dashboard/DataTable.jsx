/**
 * DataTable.jsx — Universal Searchable Data Table Component
 * =========================================================
 * WHAT THIS COMPONENT DOES:
 *  Provides a standardized, responsive table layout for displaying structured data.
 *  It includes an optional built-in search bar that instantly filters rows across
 *  all columns, and handles empty states gracefully.
 *
 * WHY IT IS REUSABLE ACROSS ALL DASHBOARDS:
 *  - Super Admins use it for the "Live Branch Registry".
 *  - Doctors use it for the "Appointments List".
 *  - Lab Techs use it for "Recent Test Requests".
 *  - Branch Admins use it for managing doctors and staff.
 *  - It is completely agnostic to the data type. You pass in an array of column
 *    definitions and an array of raw data, and it renders everything dynamically.
 *
 * PROPS EXPLANATION:
 *  @param {Array}   columns           — Array of objects defining columns: [{ key: 'id', header: 'ID', render?: func }]
 *  @param {Array}   data              — Array of data objects (e.g., [{ id: 1, name: 'Rahul' }])
 *  @param {boolean} searchable        — If true, renders a search input above the table
 *  @param {string}  searchPlaceholder — Custom placeholder text for the search input
 *  @param {string}  emptyMessage      — Message shown when `data` is empty or search yields no results
 */

import React, { useState } from 'react';
import './DataTable.css';

export default function DataTable({
  columns = [],
  data = [],
  searchable = true,
  searchPlaceholder = 'Search records...',
  emptyMessage = 'No records found.'
}) {
  // State to hold the current search query
  const [query, setQuery] = useState('');

  // Filter data based on search query (checks all object values as strings)
  const filteredData = data.filter((row) =>
    Object.values(row).some((val) =>
      String(val ?? '').toLowerCase().includes(query.toLowerCase())
    )
  );

  return (
    <div className="table-container">

      {/* RENDER SEARCH BAR IF ENABLED */}
      {searchable && (
        <div className="table-search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {/* RENDER TABLE CONTAINER */}
      <div className="table-wrap">
        <table className="custom-data-table">
          
          {/* Table Headers dynamically generated from columns prop */}
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>

          {/* Table Body dynamically generated from data prop */}
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {/* If column has a custom render function, use it; otherwise output raw text */}
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              /* EMPTY STATE: Shown if no data matches the search or array is empty */
              <tr>
                <td colSpan={columns.length} className="table-empty">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

    </div>
  );
}
