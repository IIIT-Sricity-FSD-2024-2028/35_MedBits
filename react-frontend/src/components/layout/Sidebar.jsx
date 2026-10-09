/**
 * Sidebar.jsx — Shared Sidebar Component for All Portals
 * ========================================================
 * Replaces ALL per-actor sidebar HTML files:
 *   - html/branch-admin/components/ba_sidebar.html
 *   - html/doctor/components/sidebar.html
 *   - html/superuser/components/sidebar.html
 *   - html/components/p_sidebar.html
 *   - html/components/fd_sidebar.html
 *   - js/lab-technician/components.js  → getSidebarTemplate()
 *
 * PROPS:
 *   isCollapsed  {boolean}  — true = sidebar shows icons only (desktop collapse)
 *   isMobileOpen {boolean}  — true = sidebar slides in on mobile
 *   onCloseMobile {func}    — called when user taps the overlay to close on mobile
 *
 * The sidebar reads the current user's ROLE from AuthContext and picks
 * the correct nav items from navConfig.js automatically.
 *
 * HOOKS USED:
 *   useAuth()    — from AuthContext, gives us `user` and `logout`
 *   useLocation  — from react-router-dom, tells us the current URL path
 *                  so we can highlight the active nav item
 *   useNavigate  — from react-router-dom, lets us navigate programmatically
 *                  (replaces window.location.replace() / window.location.href)
 */

import { useAuth }            from '../../context/AuthContext';
import { getNavItems }        from '../../config/navConfig';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

/**
 * Sidebar Component
 *
 * @param {boolean} isCollapsed   — desktop collapsed state (icons only)
 * @param {boolean} isMobileOpen  — mobile open state (slides in from left)
 * @param {function} onCloseMobile — callback to close on mobile overlay tap
 */
export default function Sidebar({ isCollapsed, isMobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();   // read user + logout from global context
  const navigate = useNavigate();       // for redirecting after logout

  /* Get the correct nav items for this user's role (e.g. doctor, labtech, etc.) */
  const navItems = getNavItems(user?.role);

  /**
   * handleLogout — Clears session and redirects to login.
   * Replaces: logoutDoctor(), logoutLabTech(), clearSession() + window.location.replace()
   */
  function handleLogout(e) {
    e.preventDefault();         // prevent the <a> tag from navigating
    logout();                   // clears localStorage + React state
    navigate('/login');         // go to login page
  }

  /*
   * Build sidebar CSS classes:
   *   Base:       "sidebar"
   *   Collapsed:  "sidebar collapsed"    ← icons only, no labels
   *   Mobile:     "sidebar mobile-open"  ← slides in from left
   */
  const sidebarClass = [
    'sidebar',
    isCollapsed  ? 'collapsed'    : '',
    isMobileOpen ? 'mobile-open'  : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {/*
       * Mobile Overlay — dark backdrop behind the sidebar on small screens.
       * Tapping it calls onCloseMobile to close the sidebar.
       * Only rendered when isMobileOpen is true.
       *
       * Replaces: the dynamically created overlay div in the old components.js
       */}
      {isMobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={sidebarClass} aria-label="Main navigation">

        {/* ── BRAND LOGO ─────────────────────────────────────────────
            Replaces: <div class="sidebar-brand"> in all sidebar HTMLs
            The ✚ icon is the MEDBITS brand cross.
        ── */}
        <div className="sidebar-brand">
          <span className="brand-icon">✚</span>
          {/* brand-text is hidden via CSS when sidebar is collapsed */}
          <span className="brand-text">MEDBITS</span>
        </div>

        {/* ── NAVIGATION LINKS ───────────────────────────────────────
            Replaces: the hardcoded <nav class="sidebar-nav"><a>...</a></nav>
            in all the sidebar HTML files.

            NavLink from React Router:
              - Acts like a normal <a> tag but knows if it's the current page.
              - `className` prop accepts a FUNCTION that receives { isActive }.
              - We use this to add the "active" CSS class automatically
                (replacing the old JS: document.querySelector('.nav-item[data-page=...]').classList.add('active'))
        ── */}
        <nav className="sidebar-nav" aria-label="Portal navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              /*
               * className as a function:
               *   isActive = true when the current URL matches item.path
               *   This automatically adds "active" to the link, no manual JS needed!
               */
              className={({ isActive }) =>
                ['nav-item', isActive ? 'active' : ''].filter(Boolean).join(' ')
              }
              /*
               * data-tooltip is used by CSS to show a tooltip when sidebar is collapsed.
               * Replaces: .sidebar.collapsed .nav-item::after { content: attr(data-tooltip); }
               */
              data-tooltip={item.label}
            >
              {/* Icon — always visible, even when collapsed */}
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>

              {/* Label — hidden via CSS when sidebar is collapsed */}
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* ── SIDEBAR BOTTOM (Logout) ─────────────────────────────────
            Replaces: <div class="sidebar-bottom"> with logout-btn
            in all the sidebar HTML files.
        ── */}
        <div className="sidebar-bottom">
          <a
            href="/login"
            className="nav-item nav-logout"
            onClick={handleLogout}
            role="button"
          >
            <span className="nav-icon" aria-hidden="true">⇥</span>
            <span className="nav-label">Logout</span>
          </a>
        </div>

      </aside>
    </>
  );
}
