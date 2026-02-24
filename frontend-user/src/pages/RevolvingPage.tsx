import { Box, Button, Card, CardContent, Stack, Switch, Typography } from '@mui/material';
import { useState } from 'react';
import { TableSection } from '@/components/common/TableSection';
import { useSnackbar } from '@/contexts/SnackbarContext';

const installmentRows = [{ id: 1, approvalId: 9203, months: 3, status: 'ACTIVE', createdAt: '2026-03-05' }];

export const RevolvingPage = () => {
  const { show } = useSnackbar();
  const [enabled, setEnabled] = useState(false);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        리볼빙 / 분할납부(모의)
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
            <Button variant="outlined" onClick={() => show('분할납부 신청이 접수되었습니다. (모의)', 'success')}>
              분할납부 신청
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <TableSection
        rows={installmentRows}
        columns={[
          { field: 'approvalId', headerName: '거래 ID', flex: 1 },
          { field: 'months', headerName: '개월수', flex: 1 },
          { field: 'status', headerName: '상태', flex: 1 },
          { field: 'createdAt', headerName: '등록일', flex: 1 },
        ]}
      />
    </Box>
  );
};
