import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './guards';
import { UserLayout } from '@/components/layout/UserLayout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { StatementListPage } from '@/pages/statements/StatementListPage';
import { StatementDetailPage } from '@/pages/statements/StatementDetailPage';
import { ApprovalsPage } from '@/pages/ApprovalsPage';
import { CardsPage } from '@/pages/CardsPage';
import { PointsPage } from '@/pages/PointsPage';
import { SupportInquiriesPage } from '@/pages/support/SupportInquiriesPage';
import { DocsPage } from '@/pages/DocsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <UserLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/statements', element: <StatementListPage /> },
          { path: '/statements/:id', element: <StatementDetailPage /> },
          { path: '/approvals', element: <ApprovalsPage /> },
          { path: '/cards', element: <CardsPage /> },
          { path: '/points', element: <PointsPage /> },
          { path: '/support/inquiries', element: <SupportInquiriesPage /> },
          { path: '/docs', element: <DocsPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
        ],
      },
    ],
  },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
