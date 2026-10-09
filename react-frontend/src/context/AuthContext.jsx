/**
 * AuthContext.jsx — Global Authentication State
 * ================================================
 * This file replaces the old `auth.js` + per-portal `getSession()` functions.
 *
 * HOW IT WORKS:
 *  - We use React's Context API to share the logged-in user across the whole app
 *    without prop-drilling (passing props down through many components manually).
 *
 *  - Any component anywhere in the tree can call `useAuth()` to get:
 *      • `user`     — the current user object (or null if not logged in)
 *      • `login()`  — saves user to state + localStorage
 *      • `logout()` — clears user from state + localStorage
 *
 * HOOKS USED:
 *  - createContext  → creates a "context bucket" that holds shared data
 *  - useContext     → lets a component READ from that bucket
 *  - useState       → stores the user object in component state (triggers re-renders)
 *  - useCallback    → memoizes functions so they don't get recreated on every render
 *                     (important for functions passed to Context, prevents infinite loops)
 */

import { createContext, useContext, useState, useCallback } from 'react';

/* ── Storage key — must match auth.js in the old frontend ── */
const USER_STORAGE_KEY = 'user';

/**
 * The "bucket" that holds auth data.
 * Think of it like a global variable that React components can subscribe to.
 */
const AuthContext = createContext(null);

/**
 * Role → React Router route mapping.
 * Mirrors the `routes` object in the old auth.js `redirectByRole()` function.
 *
 * When a user logs in, we use this to figure out where to send them.
 */
export const ROLE_ROUTES = {
  super_admin:  '/superuser/dashboard',
  branch_admin: '/branch-admin/dashboard',
  admin:        '/branch-admin/dashboard',   // 'admin' is an alias for branch_admin
  patient:      '/patient/dashboard',
  doctor:       '/doctor/dashboard',
  frontdesk:    '/front-desk/dashboard',
  labtech:      '/lab-technician/dashboard',
};

/**
 * AuthProvider — Wraps the whole app so every component can access auth state.
 *
 * Usage (in main.jsx or App.jsx):
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 */
export function AuthProvider({ children }) {
  /**
   * useState initializer:
   *  The function inside useState() runs ONCE on first render to set the initial value.
   *  Here, we read from localStorage so the user stays logged in after page refresh.
   */
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      // If localStorage data is corrupted, start fresh (not logged in)
      return null;
    }
  });

  /**
   * login(userData) — Called after a successful API login response.
   * Saves the user to both React state AND localStorage (so it persists on refresh).
   *
   * useCallback: Wraps the function so it's only re-created if its dependencies change.
   * Without this, a new function reference is created on every render, which can
   * cause infinite loops when passed as a prop or stored in useEffect dependencies.
   */
  const login = useCallback((userData) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  /**
   * logout() — Clears auth from both state and localStorage.
   * React will re-render components that use `user`, making ProtectedRoute redirect.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  /**
   * getInitials(name) — Helper used by Topbar to show "RS" for "Ria Sharma".
   * Exported via context so any component can use it without duplicating logic.
   */
  const getInitials = useCallback((name = '') => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??';
  }, []);

  /* The value object is what components receive when they call useAuth() */
  const value = { user, login, logout, getInitials };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth() — Custom hook to consume auth context.
 *
 * Why a custom hook instead of using `useContext(AuthContext)` directly?
 *  → It gives a clear error if someone forgets to wrap their component with <AuthProvider>.
 *  → It's cleaner: `const { user } = useAuth()` vs `const { user } = useContext(AuthContext)`.
 *
 * Usage inside any component:
 *   import { useAuth } from '../context/AuthContext';
 *   const { user, logout } = useAuth();
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be used inside an <AuthProvider>. Check your main.jsx.');
  }
  return ctx;
}
