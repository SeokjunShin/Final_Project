import { Box, CircularProgress, Typography } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '@shared/types';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const LoadingScreen = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
    <CircularProgress />
    <Typography variant="body2" color="text.secondary">로딩 중...</Typography>
  </Box>
);

export const ProtectedRoute = ({ roles }: { roles: Role[] }) => {
  const { ready, isAuthenticated, canAccess } = useAdminAuth();

  if (!ready) {
    return <LoadingScreen />;
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
  const { ready, isAuthenticated, user } = useAdminAuth();

  if (!ready) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'REVIEWER' ? "/documents" : "/dashboard"} replace />;
  }

  return <Outlet />;
};
