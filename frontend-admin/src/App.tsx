import { Box, Typography } from '@mui/material';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes/router';

const isAllowedHost = () => {
  const host = window.location.hostname;
  return host === 'admin.mycard.local' || host === 'localhost' || host === '127.0.0.1';
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
