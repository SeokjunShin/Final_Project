import { Box, CircularProgress, Typography } from '@mui/material';
import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import type { Role } from '@shared/types';
import { PublicRoute, ProtectedRoute } from './guards';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminLoginPage } from '@/pages/LoginPage';
import { AdminDashboardPage } from '@/pages/DashboardPage';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

/** 루트(/) 접속 시 보여줄 화면 + /dashboard로 리다이렉트 (빈 화면 방지) */
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
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';

const ALL_ADMIN_ROLES: Role[] = ['OPERATOR', 'MASTER_ADMIN', 'REVIEW_ADMIN'];
const COUNSEL_ROLES: Role[] = ['OPERATOR', 'MASTER_ADMIN'];
const REVIEW_ROLES: Role[] = ['REVIEW_ADMIN', 'MASTER_ADMIN'];
const MASTER_ONLY_ROLES: Role[] = ['MASTER_ADMIN'];

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    element: <PublicRoute />,
    children: [{ path: '/login', element: <AdminLoginPage /> }],
  },
  {
    element: <ProtectedRoute roles={ALL_ADMIN_ROLES} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: '/dashboard',
            element: <ProtectedRoute roles={ALL_ADMIN_ROLES}><AdminDashboardPage /></ProtectedRoute>,
          },
          {
            path: '/board-inquiries',
            element: <ProtectedRoute roles={COUNSEL_ROLES}><AdminInquiryBoardPage /></ProtectedRoute>,
          },
          {
            path: '/support/inquiries',
            element: <ProtectedRoute roles={COUNSEL_ROLES}><InquiriesPage /></ProtectedRoute>,
          },
          {
            path: '/inquiries',
            element: <ProtectedRoute roles={COUNSEL_ROLES}><Navigate to="/support/inquiries" replace /></ProtectedRoute>,
          },
          {
            path: '/card-applications',
            element: <ProtectedRoute roles={REVIEW_ROLES}><CardApplicationsPage /></ProtectedRoute>,
          },
          {
            path: '/reissue-requests',
            element: <ProtectedRoute roles={REVIEW_ROLES}><ReissueRequestsPage /></ProtectedRoute>,
          },
          {
            path: '/loans',
            element: <ProtectedRoute roles={REVIEW_ROLES}><LoansPage /></ProtectedRoute>,
          },
          {
            path: '/documents',
            element: <ProtectedRoute roles={REVIEW_ROLES}><DocumentsPage /></ProtectedRoute>,
          },
          {
            path: '/messages',
            element: <ProtectedRoute roles={COUNSEL_ROLES}><MessagesPage /></ProtectedRoute>,
          },
          {
            path: '/users',
            element: <ProtectedRoute roles={MASTER_ONLY_ROLES}><UsersPage /></ProtectedRoute>,
          },
          {
            path: '/merchants',
            element: <ProtectedRoute roles={MASTER_ONLY_ROLES}><MerchantsPage /></ProtectedRoute>,
          },
          {
            path: '/policies/points',
            element: <ProtectedRoute roles={MASTER_ONLY_ROLES}><PointPolicyPage /></ProtectedRoute>,
          },
          {
            path: '/audit-logs',
            element: <ProtectedRoute roles={MASTER_ONLY_ROLES}><AuditLogsPage /></ProtectedRoute>,
          },
          {
            path: '/events',
            element: <ProtectedRoute roles={MASTER_ONLY_ROLES}><EventsPage /></ProtectedRoute>,
          },
        ],
      },
    ],
  },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
