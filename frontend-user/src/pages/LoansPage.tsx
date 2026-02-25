import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { TableSection } from '@/components/common/TableSection';
import { useSnackbar } from '@/contexts/SnackbarContext';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const rows: { id: number; loanType: string; principal: number; status: string; requestedAt: string }[] = [];

export const LoansPage = () => {
  const { show } = useSnackbar();
  const [amount, setAmount] = useState('');

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        금융서비스 - 대출
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="신청 금액" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Button variant="contained" onClick={() => show('대출 신청이 접수되었습니다.', 'success')}>
              대출 신청
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {rows.length > 0 ? (
        <TableSection
          rows={rows}
          columns={[
            { field: 'loanType', headerName: '유형', flex: 1 },
            { field: 'principal', headerName: '원금', flex: 1 },
            { field: 'status', headerName: '상태', flex: 1 },
            { field: 'requestedAt', headerName: '신청일', flex: 1 },
          ]}
        />
      ) : (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <AccountBalanceIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#666', mb: 1 }}>
              대출 내역이 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary">
              대출 신청이 승인되면 여기에 표시됩니다.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
