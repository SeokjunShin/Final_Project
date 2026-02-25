import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';

export const BenefitsPage = () => {
  const { show } = useAdminSnackbar();
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  const handleSave = () => {
    if (!name || !value) {
      show('정책명과 값을 입력해주세요.', 'error');
      return;
    }
    // TODO: API 연동 필요 - /admin/policies/benefits
    show('혜택 정책 저장 기능이 아직 구현되지 않았습니다.', 'info');
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        혜택 정책 관리
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="정책명" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="정책값" value={value} onChange={(e) => setValue(e.target.value)} />
            <Button variant="contained" onClick={handleSave}>
              저장
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          혜택 정책 API가 아직 구현되지 않았습니다.
        </Typography>
      </Box>
    </Box>
  );
};
