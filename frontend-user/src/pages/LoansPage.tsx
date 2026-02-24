import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { TableSection } from '@/components/common/TableSection';
import { useSnackbar } from '@/contexts/SnackbarContext';

const rows = [
  { id: 1, loanType: 'CASH_ADVANCE', principal: 200000, status: 'DISBURSED', requestedAt: '2026-03-08' },
];

export const LoansPage = () => {
  const { show } = useSnackbar();
  const [amount, setAmount] = useState('');

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        금융서비스 - 대출(모의)
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="신청 금액" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Button variant="contained" onClick={() => show('대출 신청이 접수되었습니다. (모의)', 'success')}>
              대출 신청
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <TableSection
        rows={rows}
        columns={[
          { field: 'loanType', headerName: '유형', flex: 1 },
          { field: 'principal', headerName: '원금', flex: 1 },
          { field: 'status', headerName: '상태', flex: 1 },
          { field: 'requestedAt', headerName: '신청일', flex: 1 },
        ]}
      />
    </Box>
  );
};
