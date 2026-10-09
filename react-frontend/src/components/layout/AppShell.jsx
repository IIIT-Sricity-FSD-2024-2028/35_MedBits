/**
 * AppShell.jsx — The Master Layout Wrapper for All Authenticated Pages
 * ======================================================================
 * This component is the layout "shell" that wraps every authenticated page.
 * It combines Sidebar + Topbar + the page content area into one structure.
 *
 * REPLACES: The boilerplate HTML layout found at the top of EVERY old HTML page:
 *   <div class="app-shell">
 *     <div id="sidebarMount"></div>
 *     <div class="main-wrapper" id="mainWrapper">
 *       <div id="headerMount"></div>
 *       <main class="page-content"> ... </main>
 *     </div>
 *   </div>
 *
 * HOW TO USE:
 *   In any page component (e.g. DoctorDashboard.jsx), wrap the page content:
 *
 *     export default function DoctorDashboard() {
 *       return (
 *         <AppShell pageTitle="Dashboard">
 *           <p>Dashboard content goes here</p>
 *         </AppShell>
 *       );
 *     }
 *
 * PROPS:
 *   pageTitle  {string}     — passed to Topbar to display as the page heading
 *   children   {ReactNode}  — the actual page content to render inside <main>
 *
 * HOOKS:
 *   useState   — tracks whether sidebar is collapsed (desktop) or open (mobile)
 *   useEffect  — listens for window resize to reset mobile state on larger screens
 */

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar  from './Topbar';
import './AppShell.css';

/**
 * AppShell — Layout wrapper for all authenticated pages
 *
 * @param {string}    pageTitle  — page heading shown in Topbar
 * @param {ReactNode} children   — the page-specific content
 */
export default function AppShell({ pageTitle = 'Dashboard', children }) {
  /*
   * isCollapsed — desktop sidebar collapsed state (icons only, no labels).
   * Replaces: sidebar.classList.toggle('collapsed') from components.js
   */
  const [isCollapsed, setIsCollapsed] = useState(false);

  /*
   * isMobileOpen — whether the sidebar drawer is open on mobile screens.
   * On mobile, the sidebar is hidden off-screen by default and slides in when open.
   * Replaces: sidebar.classList.toggle('open') for mobile in the old JS.
   */
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  /*
   * useEffect — watch for window resizing.
   * If the user resizes from mobile → desktop, close the mobile drawer.
   * This matches the old code's `if (window.innerWidth <= 900)` check.
   */
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 900) {
        setIsMobileOpen(false);   // close mobile drawer on desktop
      }
    }
    window.addEventListener('resize', handleResize);

    /* Cleanup: remove the listener when AppShell unmounts */
    return () => window.removeEventListener('resize', handleResize);
  }, []); // runs once on mount

  /**
   * handleToggle — called when the hamburger button in Topbar is clicked.
   *
   * Old behaviour (from components.js):
   *   if (window.innerWidth <= 900) {
   *     sidebar.classList.toggle('open');         ← mobile: slide in/out
   *   } else {
   *     sidebar.classList.toggle('collapsed');    ← desktop: collapse to icons
   *     mainWrapper.classList.toggle('sidebar-collapsed');
   *   }
   *
   * React equivalent: update state, CSS handles the rest via class names.
   */
  function handleToggle() {
    if (window.innerWidth <= 900) {
      setIsMobileOpen((prev) => !prev);  // toggle mobile drawer
    } else {
      setIsCollapsed((prev) => !prev);   // toggle desktop collapse
    }
  }

  /*
   * Build the main-wrapper class.
   * When sidebar is collapsed, we add 'sidebar-collapsed' so the content
   * shifts left (margin-left: 64px instead of 240px).
   * Replaces: mainWrapper.classList.toggle('sidebar-collapsed')
   */
  const mainWrapperClass = [
    'main-wrapper',
    isCollapsed ? 'sidebar-collapsed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="app-shell">

      {/*
       * Sidebar — receives collapse + mobile state as props.
       * Also receives onCloseMobile so it can close itself when overlay is tapped.
       */}
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/*
       * Main wrapper — shifts right to accommodate the sidebar.
       * Has transition so the shift is animated when sidebar collapses.
       */}
      <div className={mainWrapperClass} id="mainWrapper">

        {/* Topbar sticks to the top of the main-wrapper (position: sticky) */}
        <Topbar
          pageTitle={pageTitle}
          onToggle={handleToggle}
        />

        {/*
         * Main content area — this is where each page's content renders.
         * `children` is whatever you put inside <AppShell> in a page component.
         */}
        <main className="page-content">
          {children}
        </main>

      </div>
    </div>
  );
}
