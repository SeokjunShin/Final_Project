import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicRoute, ProtectedRoute } from './guards';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminLoginPage } from '@/pages/LoginPage';
import { AdminDashboardPage } from '@/pages/DashboardPage';
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
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
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
          { path: '/messages', element: <MessagesPage /> },
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
          { path: '/users', element: <UsersPage /> },
          { path: '/merchants', element: <MerchantsPage /> },
          { path: '/benefits', element: <BenefitsPage /> },
          { path: '/events', element: <EventsPage /> },
          { path: '/policies/points', element: <PointPolicyPage /> },
          { path: '/audit-logs', element: <AuditLogsPage /> },
          { path: '/card-applications', element: <CardApplicationsPage /> },
        ],
      },
    ],
  },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
