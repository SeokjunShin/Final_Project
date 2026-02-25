import { Box, Button, Card, CardContent, Stack, Switch, Typography } from '@mui/material';
import { useState } from 'react';
import { TableSection } from '@/components/common/TableSection';
import { useSnackbar } from '@/contexts/SnackbarContext';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const installmentRows: { id: number; approvalId: number; months: number; status: string; createdAt: string }[] = [];

export const RevolvingPage = () => {
  const { show } = useSnackbar();
  const [enabled, setEnabled] = useState(false);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        리볼빙 / 분할납부
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography>리볼빙 사용</Typography>
            <Switch
              checked={enabled}
              onChange={(_, checked) => {
                setEnabled(checked);
                show(`리볼빙이 ${checked ? '활성화' : '비활성화'} 되었습니다.`, 'success');
              }}
            />
            <Button variant="outlined" onClick={() => show('분할납부 신청이 접수되었습니다.', 'success')}>
              분할납부 신청
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {installmentRows.length > 0 ? (
        <TableSection
          rows={installmentRows}
          columns={[
            { field: 'approvalId', headerName: '거래 ID', flex: 1 },
            { field: 'months', headerName: '개월수', flex: 1 },
            { field: 'status', headerName: '상태', flex: 1 },
            { field: 'createdAt', headerName: '등록일', flex: 1 },
          ]}
        />
      ) : (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <ReceiptLongIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#666', mb: 1 }}>
              분할납부 내역이 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary">
              카드 결제 후 분할납부를 신청하시면 여기에 표시됩니다.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
