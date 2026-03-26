import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export const ForbiddenPage = () => {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const handleGoToLogin = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        권한이 없습니다.
      </Typography>
      <Button variant="contained" onClick={handleGoToLogin}>
        로그인으로 이동
      </Button>
    </Box>
  );
};
