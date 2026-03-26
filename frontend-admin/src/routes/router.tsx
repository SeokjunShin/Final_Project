import { Box, CircularProgress, Typography } from '@mui/material';
import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
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

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    element: <PublicRoute />,
    children: [{ path: '/login', element: <AdminLoginPage /> }],
  },

  /* ── 공통: 모든 관리자 역할 접근 가능 ── */
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

  /* ── 심사원(REVIEW_ADMIN) 전용: 카드심사, 대출, 문서, 재발급, 메시지 ── */
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

  /* ── 상담원(OPERATOR) 전용: 문의 게시판, 문의 큐 ── */
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

  /* ── 마스터관리자(MASTER_ADMIN) 전용: 사용자, 가맹점, 이벤트, 정책, 감사로그 ── */
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

  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
