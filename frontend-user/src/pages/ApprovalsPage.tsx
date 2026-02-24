import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { approvalsApi } from '@/api';
import { TableSection } from '@/components/common/TableSection';

export const ApprovalsPage = () => {
  const [keyword, setKeyword] = useState('');
  const { data, refetch, isFetching } = useQuery({
    queryKey: ['approvals', keyword],
    queryFn: async () => {
      try {
        return await approvalsApi.list({ keyword });
      } catch {
        return {
          content: [
            { id: 1, approvedAt: '2026-02-23 10:11', merchantName: '편의점', cardMaskedNumber: '****-9012', amount: 6900, status: 'APPROVED' },
            { id: 2, approvedAt: '2026-02-22 18:40', merchantName: '온라인쇼핑', cardMaskedNumber: '****-9012', amount: 85000, status: 'CANCELED' },
          ],
          totalElements: 2,
          totalPages: 1,
          number: 0,
          size: 10,
        };
      }
    },
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        승인/취소 내역
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField label="가맹점" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <Button variant="outlined" onClick={() => refetch()}>
          필터
        </Button>
        <Button variant="contained" onClick={() => refetch()} disabled={isFetching}>
          갱신
        </Button>
      </Stack>
      <TableSection
        rows={data?.content ?? []}
        columns={[
          { field: 'approvedAt', headerName: '승인일시', flex: 1 },
          { field: 'merchantName', headerName: '가맹점', flex: 1 },
          { field: 'cardMaskedNumber', headerName: '카드', flex: 1 },
          { field: 'amount', headerName: '금액', flex: 1, valueFormatter: (v: number) => `${v.toLocaleString('ko-KR')}원` },
          { field: 'status', headerName: '상태', flex: 1 },
        ]}
      />
    </Box>
  );
};
