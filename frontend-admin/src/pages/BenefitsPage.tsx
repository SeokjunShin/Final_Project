import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { AdminTable } from '@/components/common/AdminTable';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';

const rows = [
  { id: 1, policyName: '기본 적립률', value: '1.0%', status: 'ACTIVE' },
  { id: 2, policyName: '캐시백 프로모션', value: '2.0%', status: 'ACTIVE' },
];

export const BenefitsPage = () => {
  const { show } = useAdminSnackbar();
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

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
            <Button variant="contained" onClick={() => show('혜택 정책이 저장되었습니다. (모의)', 'success')}>
              저장
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <AdminTable
        rows={rows}
        columns={[
          { field: 'policyName', headerName: '정책명', flex: 2 },
          { field: 'value', headerName: '값', flex: 1 },
          { field: 'status', headerName: '상태', flex: 1 },
        ]}
      />
    </Box>
  );
};
