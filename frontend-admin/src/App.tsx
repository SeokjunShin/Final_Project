import { Box, Typography } from '@mui/material';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes/router';

const isAllowedHost = () => {
  const host = window.location.hostname;
  // 로컬/개발: localhost, 127.0.0.1, admin.mycard.local
  if (host === 'admin.mycard.local' || host === 'localhost' || host === '127.0.0.1') return true;
  if (import.meta.env.DEV && window.location.port === '5174') return true; // Vite 개발 서버
  // 프로덕션: 내부 IP 또는 8081 포트(admin nginx)로 접속 시 허용
  if (window.location.port === '8081') return true;
  // 내부 네트워크 IP 허용 (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return true;
  return false;
};

export const App = () => {
  if (!isAllowedHost()) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          접근 불가
        </Typography>
        <Typography sx={{ mt: 1 }}>관리자 포털은 admin.mycard.local 도메인에서만 접근할 수 있습니다.</Typography>
      </Box>
    );
  }
  return <RouterProvider router={router} />;
};
