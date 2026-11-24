/**
 * LayoutShell.jsx — Persistent Layout Wrapper for Authenticated Routes
 * =====================================================================
 * This component solves the AppShell remount problem.
 *
 * THE OLD PROBLEM:
 *   Every page component (DoctorDashboard, ConsultationNotes, etc.) wrapped
 *   itself in <AppShell pageTitle="...">. When React Router navigated between
 *   pages, the entire AppShell was unmounted and remounted, which:
 *     - Reset the sidebar collapsed state to its default (expanded) on every nav
 *     - Caused the notification list to reset back to DEMO_NOTIFICATIONS
 *     - Re-triggered the window resize useEffect unnecessarily
 *     - Caused visual flicker as the layout rebuilt from scratch
 *
 * THE FIX (React Router nested layout routes):
 *   LayoutShell renders once and stays mounted for all authenticated routes.
 *   It renders AppShell once, and uses React Router's <Outlet /> to swap only
 *   the page-specific content area.
 *
 *   HOW PAGE TITLES WORK:
 *   Each page component sets its title by passing it via the route's
 *   `handle` object in App.jsx (see the `handle: { pageTitle: '...' }` on
 *   each route). LayoutShell reads it with useMatches() from React Router.
 *
 * ROUTE STRUCTURE (in App.jsx):
 *   <Route element={<LayoutShell />}>
 *     <Route path="/doctor/dashboard" handle={{ pageTitle: 'Dashboard' }}
 *            element={<DoctorDashboard />} />
 *     <Route path="/doctor/profile"   handle={{ pageTitle: 'My Profile' }}
 *            element={<DoctorProfile />} />
 *   </Route>
 *
 * HOOKS USED:
 *   useMatches — returns the full list of matched route objects including
 *                their `handle` metadata. We pick the deepest match (last item)
 *                to get the current page's title.
 *   Outlet     — renders the matched child route's element in place
 */

import { useMatches, Outlet } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';

export default function LayoutShell() {
  /**
   * useMatches() returns an array of every route that matched the current URL,
   * from the root route down to the most specific leaf route.
   *
   * Example: navigating to /doctor/dashboard returns:
   *   [
   *     { id: '0', pathname: '/', handle: undefined },          ← root
   *     { id: '0-0', pathname: '/doctor/dashboard',
   *       handle: { pageTitle: 'Dashboard' } }                  ← our page
   *   ]
   *
   * We pick the LAST match (most specific) and read its handle.pageTitle.
   */
  const matches = useMatches();
  const currentMatch = matches[matches.length - 1];
  const pageTitle = currentMatch?.handle?.pageTitle ?? 'Dashboard';

  return (
    /**
     * AppShell is rendered ONCE and stays mounted as the user navigates.
     * Only the content inside <Outlet /> (the page component) swaps on navigation.
     * This preserves:
     *   - Sidebar collapsed/expanded state
     *   - Mobile drawer open/closed state
     *   - Notification list state in Topbar
     */
    <AppShell pageTitle={pageTitle}>
      <Outlet />
    </AppShell>
  );
}
