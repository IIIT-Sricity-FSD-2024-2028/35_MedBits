/**
 * Topbar.jsx — Shared Top Navigation Bar for All Portals
 * ========================================================
 * Replaces ALL per-actor header/navbar HTML files:
 *   - html/branch-admin/components/ba_navbar.html
 *   - html/doctor/components/header.html
 *   - html/superuser/components/header.html
 *   - html/components/p_navbar.html
 *   - html/components/fd_navbar.html
 *   - js/lab-technician/components.js → getHeaderTemplate()
 *
 * FEATURES (matching original behaviour):
 *   ✓ Hamburger button — toggles sidebar on mobile / collapses on desktop
 *   ✓ Dynamic page title — shows current page name
 *   ✓ Portal label     — shows "Doctor Portal", "Patient Portal" etc.
 *   ✓ Notification bell — with badge count
 *   ✓ Notification dropdown — lists recent notifications
 *   ✓ User avatar chip — shows initials + name + role
 *   ✓ Profile dropdown  — links to profile page + logout
 *
 * PROPS:
 *   pageTitle    {string}   — current page title (e.g. "Dashboard")
 *   onToggle     {function} — called when hamburger is clicked
 *
 * HOOKS USED:
 *   useAuth()     — gets current user for name/role/initials
 *   useNavigate   — for logout redirect
 *   useState      — tracks open/close state of dropdowns
 *   useEffect     — attaches a global click listener to close dropdowns
 *                   when the user clicks outside them
 *   useRef        — gets a reference to a DOM element without causing re-renders
 *                   (used to detect clicks outside the notification dropdown)
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link }           from 'react-router-dom';
import { useAuth }                     from '../../context/AuthContext';
import { getPortalLabel }              from '../../config/navConfig';
import './Topbar.css';

/**
 * Sample notification data.
 * In the future this can be replaced with a real API call.
 * Mirrors the hardcoded notifications in doctor/components.js getHeaderTemplate().
 */
const DEMO_NOTIFICATIONS = [
  { id: 1, text: 'New appointment confirmed', detail: '10:00 AM today',      isUnread: true  },
  { id: 2, text: 'Lab result ready',          detail: 'Yesterday, 4:30 PM',  isUnread: true  },
  { id: 3, text: 'Follow-up reminder',        detail: 'Yesterday, 2:00 PM',  isUnread: false },
];

/**
 * Topbar Component
 *
 * @param {string}   pageTitle  — displayed as the main page title
 * @param {function} onToggle   — hamburger button click handler (passed from AppShell)
 */
export default function Topbar({ pageTitle, onToggle }) {
  const { user, logout, getInitials } = useAuth();
  const navigate = useNavigate();

  /*
   * useState — local state for dropdown open/close.
   *
   * Why local state here instead of global context?
   * → These are purely UI states (open/closed menus).
   *   Only this component cares about them. Global state is for
   *   things like the logged-in user that multiple components need.
   */
  const [notifOpen,   setNotifOpen]   = useState(false);  // notification dropdown
  const [profileOpen, setProfileOpen] = useState(false);  // profile dropdown
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);

  /*
   * useRef — gives us a direct reference to the notification dropdown DOM element.
   *
   * WHY NOT useState? Because changing a ref does NOT trigger a re-render.
   * We just need it to check "did the user click inside or outside the dropdown?"
   * — no re-render needed for that check.
   */
  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  /*
   * useEffect — runs AFTER the component renders, to attach a click listener.
   *
   * PURPOSE: Close dropdowns when the user clicks anywhere outside them.
   * This replaces: document.addEventListener('click', () => { dropdown.classList.remove('open') })
   * from the old components.js files.
   *
   * The [] empty array means this effect runs once (on mount) and the cleanup
   * function runs on unmount. This prevents memory leaks.
   */
  useEffect(() => {
    function handleOutsideClick(e) {
      // If the click is outside BOTH the notification AND profile areas, close all
      if (
        notifRef.current   && !notifRef.current.contains(e.target) &&
        profileRef.current && !profileRef.current.contains(e.target)
      ) {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);

    /* Cleanup: remove the listener when this component is removed from the DOM */
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []); // ← empty array = run once on mount

  /* Unread notification count — drives the badge number */
  const unreadCount = notifications.filter((n) => n.isUnread).length;

  /**
   * handleClearNotifications — marks all as read.
   * Replaces: notifClear.addEventListener → querySelectorAll('.notif-item.unread')...
   */
  function handleClearNotifications() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  }

  /**
   * handleLogout — same logic as in Sidebar.jsx.
   * Both the sidebar logout link and profile dropdown logout call this.
   */
  function handleLogout(e) {
    e.preventDefault();
    logout();
    navigate('/login');
  }

  /* Computed user display info */
  const userName    = user?.name  || 'User';
  const userRole    = user?.role  || '';
  const userInitials = getInitials(userName);
  const portalLabel  = getPortalLabel(userRole);

  /* Profile page path — varies by role */
  const profilePath = userRole === 'doctor'    ? '/doctor/profile'
                    : userRole === 'frontdesk' ? '/front-desk/profile'
                    : userRole === 'patient'   ? '/patient/profile'
                    : userRole === 'labtech'   ? '/lab-technician/my-account'
                    : null; // superuser and branch_admin don't have a profile page

  return (
    <header className="topbar" role="banner">

      {/* ── LEFT SIDE: Hamburger + Page Title ────────────────────── */}
      <div className="topbar-left">

        {/*
         * Hamburger / menu toggle button.
         * On desktop: collapses the sidebar to icon-only mode.
         * On mobile:  opens the sidebar as a drawer.
         * onToggle is passed in from AppShell which manages isCollapsed state.
         */}
        <button
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label="Toggle sidebar"
          aria-expanded={undefined} /* AppShell tracks actual expanded state */
        >
          {/* Three horizontal lines — the classic hamburger icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.2">
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Page title + portal label */}
        <div className="topbar-page-info">
          {/* h1 for SEO — each page has only one h1 */}
          <h1 className="page-title" id="pageTitle">{pageTitle}</h1>
          <span className="page-subtitle">{portalLabel}</span>
        </div>
      </div>

      {/* ── RIGHT SIDE: Notifications + User Profile ─────────────── */}
      <div className="topbar-right">

        {/* ── NOTIFICATION BELL ──────────────────────────────────── */}
        <div className="notif-wrapper" ref={notifRef}>
          <button
            className="topbar-btn notif-btn"
            aria-label={`Notifications (${unreadCount} unread)`}
            onClick={() => {
              setNotifOpen((prev) => !prev);  // toggle open/close
              setProfileOpen(false);           // close profile dropdown if open
            }}
          >
            {/* Bell SVG icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>

            {/* Badge — only shown when there are unread notifications */}
            {unreadCount > 0 && (
              <span className="notif-badge" aria-label={`${unreadCount} unread`}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          <div
            className={`notif-dropdown ${notifOpen ? 'open' : ''}`}
            role="dialog"
            aria-label="Notifications"
          >
            <div className="notif-header">
              <span>Notifications</span>
              <button className="notif-clear" onClick={handleClearNotifications}>
                Clear all
              </button>
            </div>

            <div className="notif-list">
              {notifications.length === 0 ? (
                <p className="notif-empty">No notifications</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`notif-item ${notif.isUnread ? 'unread' : ''}`}
                  >
                    {/* Dot indicator for unread */}
                    <div className="notif-dot" aria-hidden="true" />
                    <div className="notif-content">
                      <p>{notif.text}</p>
                      <span>{notif.detail}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── USER PROFILE CHIP ──────────────────────────────────── */}
        <div className="profile-wrapper" ref={profileRef}>
          {/*
           * Clicking the chip opens a dropdown with "My Profile" + "Logout".
           * Replaces: doctorProfile.addEventListener('click', ...) in doctor/components.js
           */}
          <button
            className={`user-chip ${profileOpen ? 'open' : ''}`}
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setNotifOpen(false);
            }}
            aria-haspopup="true"
            aria-expanded={profileOpen}
            aria-label="User menu"
          >
            {/* Avatar circle showing initials (e.g. "SJ" for Sarah Johnson) */}
            <div className="user-avatar" aria-hidden="true">
              {userInitials}
            </div>
            <div className="user-chip-info">
              <span className="user-name">{userName}</span>
              <span className="user-role">{portalLabel}</span>
            </div>
          </button>

          {/* Profile Dropdown */}
          <div
            className={`profile-dropdown ${profileOpen ? 'open' : ''}`}
            role="menu"
          >
            {/* "My Profile" link — only for roles that have a profile page */}
            {profilePath && (
              <>
                <Link
                  to={profilePath}
                  className="dropdown-item"
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                >
                  {/* User silhouette icon */}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  My Profile
                </Link>
                <div className="dropdown-divider" role="separator" />
              </>
            )}

            {/* Logout */}
            <a
              href="/login"
              className="dropdown-item logout-item"
              role="menuitem"
              onClick={handleLogout}
            >
              {/* Log-out arrow icon */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </a>
          </div>
        </div>

      </div>
    </header>
  );
}
