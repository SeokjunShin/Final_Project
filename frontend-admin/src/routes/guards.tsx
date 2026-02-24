import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '@shared/types';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export const ProtectedRoute = ({ roles }: { roles: Role[] }) => {
  const { ready, isAuthenticated, canAccess } = useAdminAuth();

  if (!ready) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccess(roles)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};

export const PublicRoute = () => {
  const { ready, isAuthenticated } = useAdminAuth();

  if (!ready) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
