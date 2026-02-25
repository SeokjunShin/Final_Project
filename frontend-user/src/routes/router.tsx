import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './guards';
import { UserLayout } from '@/components/layout/UserLayout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { MyProfilePage } from '@/pages/MyProfilePage';
import { StatementListPage } from '@/pages/statements/StatementListPage';
import { StatementDetailPage } from '@/pages/statements/StatementDetailPage';
import { ApprovalsPage } from '@/pages/ApprovalsPage';
import { CardsPage } from '@/pages/CardsPage';
import { CardApplicationsPage } from '@/pages/CardApplicationsPage';
import { LoansPage } from '@/pages/LoansPage';
import { RevolvingPage } from '@/pages/RevolvingPage';
import { PointsPage } from '@/pages/PointsPage';
import { SupportInquiriesPage } from '@/pages/support/SupportInquiriesPage';
import { DocsPage } from '@/pages/DocsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { EventsPage } from '@/pages/EventsPage';
import { PublicEventsPage } from '@/pages/PublicEventsPage';
import { CardProductsPage } from '@/pages/CardProductsPage';
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/events', element: <PublicEventsPage /> },
  { path: '/cards/products', element: <CardProductsPage /> },
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
          { path: '/my/profile', element: <MyProfilePage /> },
          { path: '/statements', element: <StatementListPage /> },
          { path: '/statements/:id', element: <StatementDetailPage /> },
          { path: '/approvals', element: <ApprovalsPage /> },
          { path: '/cards', element: <CardsPage /> },
          { path: '/cards/applications', element: <CardApplicationsPage /> },
          { path: '/finance/loans', element: <LoansPage /> },
          { path: '/finance/revolving', element: <RevolvingPage /> },
          { path: '/points', element: <PointsPage /> },
          { path: '/support/inquiries', element: <SupportInquiriesPage /> },
          { path: '/docs', element: <DocsPage /> },
          { path: '/my/events', element: <EventsPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
        ],
      },
    ],
  },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
