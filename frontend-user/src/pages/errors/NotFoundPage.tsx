import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const NotFoundPage = () => (
  <Box sx={{ p: 4 }}>
    <Typography variant="h4" sx={{ mb: 1 }}>
      404
    </Typography>
    <Typography sx={{ mb: 2 }}>페이지를 찾을 수 없습니다.</Typography>
    <Button component={RouterLink} to="/dashboard" variant="contained">
      대시보드로 이동
    </Button>
  </Box>
);
