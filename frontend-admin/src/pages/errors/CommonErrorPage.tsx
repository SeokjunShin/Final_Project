import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const CommonErrorPage = () => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#eff3fa',
      px: 3,
    }}
  >
    <Stack spacing={3} sx={{ width: '100%', maxWidth: 460, textAlign: 'center' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
        요청하신 페이지를 처리할 수 없습니다.
      </Typography>
      <Typography color="text.secondary">
        잠시 후 다시 시도해 주세요.
      </Typography>
      <Button component={RouterLink} to="/dashboard" variant="contained" size="large">
        메인으로 이동
      </Button>
    </Stack>
  </Box>
);
