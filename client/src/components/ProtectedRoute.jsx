import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute
 *
 * Wraps a dashboard route and enforces two layers of protection:
 *  1. Authentication – the user must have a valid JWT token stored.
 *  2. Authorization  – the stored user's role must be in the `allowedRoles` list.
 *
 * If either check fails the visitor is redirected:
 *  - No token → /login
 *  - Wrong role → their own dashboard (or /login as fallback)
 */

// Maps a role string to its canonical dashboard path prefix
const roleDashboardMap = {
  student:         '/student',
  class_master:    '/master',
  subject_teacher: '/master',
  exam_officer:    '/exam-officer',
  principal:       '/principal',
  bursar:          '/bursar',
  admin:           '/admin',
};

function ProtectedRoute({ element, allowedRoles }) {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  // 1. No token at all → redirect to login
  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(storedUser);
  } catch {
    // Corrupted user object → clear storage and redirect
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  // 2. Role not authorised for this route → redirect to their own dashboard
  if (!allowedRoles.includes(user.role)) {
    const ownDashboard = roleDashboardMap[user.role] || '/login';
    return <Navigate to={ownDashboard} replace />;
  }

  // 3. All checks pass → render the page
  return element;
}

export default ProtectedRoute;
