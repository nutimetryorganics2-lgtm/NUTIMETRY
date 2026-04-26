import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role, _hasHydrated } = useAuthStore();
  const location = useLocation();

  if (!_hasHydrated) return null; // Wait for store to hydrate from IndexedDB

  if (!isAuthenticated) {
    // Redirect to login but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Role not authorized, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
