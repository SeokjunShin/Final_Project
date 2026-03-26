import { Box, CircularProgress, Typography } from '@mui/material';
import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { PublicRoute, ProtectedRoute } from './guards';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminLoginPage } from '@/pages/LoginPage';
import { AdminDashboardPage } from '@/pages/DashboardPage';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { InquiriesPage } from '@/pages/InquiriesPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { UsersPage } from '@/pages/UsersPage';
import { MerchantsPage } from '@/pages/MerchantsPage';
import { EventsPage } from '@/pages/EventsPage';
import { PointPolicyPage } from '@/pages/PointPolicyPage';
import { AuditLogsPage } from '@/pages/AuditLogsPage';
import { AdminInquiryBoardPage } from '@/pages/AdminInquiryBoardPage';
import { CardApplicationsPage } from '@/pages/CardApplicationsPage';
import { ReissueRequestsPage } from '@/pages/ReissueRequestsPage';
import { LoansPage } from '@/pages/LoansPage';
import { CommonErrorPage } from '@/pages/errors/CommonErrorPage';

const RootRedirect = () => {
  const navigate = useNavigate();
  const { user, ready } = useAdminAuth();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate('/login', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, user, ready]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2, bgcolor: '#eff3fa' }}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">이동 중...</Typography>
    </Box>
  );
};

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/error', element: <CommonErrorPage /> },
  {
    element: <PublicRoute />,
    children: [{ path: '/login', element: <AdminLoginPage /> }],
  },
  {
    element: <ProtectedRoute roles={['OPERATOR', 'MASTER_ADMIN', 'REVIEW_ADMIN']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/dashboard', element: <AdminDashboardPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['REVIEW_ADMIN']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/card-applications', element: <CardApplicationsPage /> },
          { path: '/reissue-requests', element: <ReissueRequestsPage /> },
          { path: '/loans', element: <LoansPage /> },
          { path: '/documents', element: <DocumentsPage /> },
          { path: '/messages', element: <MessagesPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['OPERATOR']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/board-inquiries', element: <AdminInquiryBoardPage /> },
          { path: '/support/inquiries', element: <InquiriesPage /> },
          { path: '/inquiries', element: <Navigate to="/support/inquiries" replace /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['MASTER_ADMIN']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/users', element: <UsersPage /> },
          { path: '/merchants', element: <MerchantsPage /> },
          { path: '/events', element: <EventsPage /> },
          { path: '/policies/points', element: <PointPolicyPage /> },
          { path: '/audit-logs', element: <AuditLogsPage /> },
        ],
      },
    ],
  },
  { path: '/403', element: <Navigate to="/error" replace /> },
  { path: '*', element: <Navigate to="/error" replace /> },
]);
