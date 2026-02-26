import { Box, CircularProgress, Typography } from '@mui/material';
import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { PublicRoute, ProtectedRoute } from './guards';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminLoginPage } from '@/pages/LoginPage';
import { AdminDashboardPage } from '@/pages/DashboardPage';

/** 루트(/) 접속 시 보여줄 화면 + /dashboard로 리다이렉트 (빈 화면 방지) */
const RootRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2, bgcolor: '#eff3fa' }}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">이동 중...</Typography>
    </Box>
  );
};
import { InquiriesPage } from '@/pages/InquiriesPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { UsersPage } from '@/pages/UsersPage';
import { MerchantsPage } from '@/pages/MerchantsPage';
import { BenefitsPage } from '@/pages/BenefitsPage';
import { EventsPage } from '@/pages/EventsPage';
import { PointPolicyPage } from '@/pages/PointPolicyPage';
import { AuditLogsPage } from '@/pages/AuditLogsPage';
import { CardApplicationsPage } from '@/pages/CardApplicationsPage';
import { ReissueRequestsPage } from '@/pages/ReissueRequestsPage';
import { LoansPage } from '@/pages/LoansPage';
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    element: <PublicRoute />,
    children: [{ path: '/login', element: <AdminLoginPage /> }],
  },
  {
    element: <ProtectedRoute roles={['OPERATOR', 'ADMIN']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/dashboard', element: <AdminDashboardPage /> },
          { path: '/support/inquiries', element: <InquiriesPage /> },
          { path: '/inquiries', element: <Navigate to="/support/inquiries" replace /> },
          { path: '/documents', element: <DocumentsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['ADMIN']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/messages', element: <MessagesPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/merchants', element: <MerchantsPage /> },
          { path: '/benefits', element: <BenefitsPage /> },
          { path: '/events', element: <EventsPage /> },
          { path: '/policies/points', element: <PointPolicyPage /> },
          { path: '/audit-logs', element: <AuditLogsPage /> },
          { path: '/card-applications', element: <CardApplicationsPage /> },
          { path: '/reissue-requests', element: <ReissueRequestsPage /> },
          { path: '/loans', element: <LoansPage /> },
        ],
      },
    ],
  },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
