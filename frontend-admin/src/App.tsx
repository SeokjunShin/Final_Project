import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes/router';
import { CommonErrorPage } from '@/pages/errors/CommonErrorPage';

const isAllowedHost = () => {
  const host = window.location.hostname;
  // 로컬/개발: localhost, 127.0.0.1, admin.mycard.local
  if (host === 'admin.mycard.local' || host === 'localhost' || host === '127.0.0.1') return true;
  if (import.meta.env.DEV && window.location.port === '8081') return true; // Vite 개발 서버
  // 프로덕션: 내부 IP 허용 (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return true;
  return false;
};

export const App = () => {
  if (!isAllowedHost()) {
    return <CommonErrorPage />;
  }
  return <RouterProvider router={router} />;
};
