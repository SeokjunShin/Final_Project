import { Box, Button, Card, CardContent, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const RequestActivationPage = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(130deg, #e8f0ff 0%, #f7fbff 48%, #eaf5f2 100%)',
        px: 2,
      }}
    >
      <Card sx={{ maxWidth: 480, width: '100%', p: 2 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>
            계정 활성화 요청
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            보안 잠금 또는 이상 징후로 인해 계정 사용이 제한된 경우
            담당자(고객센터 또는 관리자)에게 잠금 해제를 요청해 주세요.
          </Typography>
          <Button component={RouterLink} to="/login" variant="contained" fullWidth sx={{ mt: 1 }}>
            로그인으로 돌아가기
          </Button>
          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
            <Link component={RouterLink} to="/" underline="hover">
              홈으로
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
