/**
 * ProtectedRoute.jsx — Role-Based Auth Guard
 * ============================================
 * Replaces the auth checks scattered in every portal's components.js:
 *   - getAuthenticatedDoctor()    → redirects if not doctor
 *   - getAuthenticatedLabTech()   → redirects if not labtech
 *   - if (!session || session.role !== 'frontdesk') window.location.href = '../login.html'
 *   - etc.
 *
 * HOW IT WORKS:
 *   Wrap any route with <ProtectedRoute allowedRoles={[...]}>.
 *   If the user is NOT logged in → redirect to /login.
 *   If the user IS logged in but has the WRONG role → redirect to /unauthorized.
 *   If the user is logged in WITH the correct role → render the children.
 *
 * USAGE (in App.jsx or wherever routes are defined):
 *
 *   <Route
 *     path="/doctor/dashboard"
 *     element={
 *       <ProtectedRoute allowedRoles={['doctor']}>
 *         <DoctorDashboard />
 *       </ProtectedRoute>
 *     }
 *   />
 *
 * HOOKS:
 *   useAuth()   — reads the current user from AuthContext
 *   Navigate    — React Router component that performs a redirect
 *                 (replaces window.location.replace() / window.location.href)
 */

import { useAuth }    from '../../context/AuthContext';
import { Navigate }   from 'react-router-dom';

/**
 * ProtectedRoute Component
 *
 * @param {string[]} allowedRoles — list of roles allowed to access this route
 *                                   e.g. ['doctor'] or ['branch_admin', 'admin']
 * @param {ReactNode} children    — the page component to render if authorised
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();

  /* CASE 1: Not logged in at all → go to login page */
  if (!user) {
    /*
     * <Navigate replace to="/login" />
     *   replace=true means the /login page REPLACES the current history entry.
     *   This matches the old `window.location.replace('../login.html')` behaviour —
     *   pressing the Back button after logout won't take you back to the dashboard.
     */
    return <Navigate to="/login" replace />;
  }

  /*
   * CASE 2: Logged in but wrong role.
   * allowedRoles.includes(user.role) checks if the user's role is in the allowed list.
   * Example: allowedRoles = ['doctor'] and user.role = 'patient' → NOT allowed.
   *
   * Special case: 'admin' is an alias for 'branch_admin', so if allowedRoles includes
   * 'branch_admin', we also allow 'admin'.
   */
  const isAllowed = allowedRoles.some(
    (role) => role === user.role ||
              (role === 'branch_admin' && user.role === 'admin')
  );

  if (!isAllowed) {
    /* Redirect to a generic unauthorized page (or back to login) */
    return <Navigate to="/unauthorized" replace />;
  }

  /* CASE 3: All good — render the page */
  return children;
}
