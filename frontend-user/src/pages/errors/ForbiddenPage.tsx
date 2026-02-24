import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const ForbiddenPage = () => (
  <Box sx={{ p: 4 }}>
    <Typography variant="h4" sx={{ mb: 1 }}>
      403
    </Typography>
    <Typography sx={{ mb: 2 }}>권한이 없습니다.</Typography>
    <Button component={RouterLink} to="/login" variant="contained">
      로그인으로 이동
    </Button>
  </Box>
);
