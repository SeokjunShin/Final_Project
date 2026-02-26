import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { approvalsApi } from '@/api';
import { TableSection } from '@/components/common/TableSection';
import { formatDateTime } from '@/utils/dateUtils';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return { label: '승인', color: 'success' as const };
    case 'CANCELED':
      return { label: '취소', color: 'error' as const };
    default:
      return { label: status, color: 'default' as const };
  }
};

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
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <ReceiptLongIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>승인/취소 내역</Typography>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField
          label="가맹점 검색"
          placeholder="가맹점명을 입력하세요"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          size="small"
        />
        <Button variant="outlined" onClick={() => refetch()}>
          검색
        </Button>
        <Button variant="contained" onClick={() => refetch()} disabled={isFetching}>
          새로고침
        </Button>
      </Stack>
      <TableSection
        rows={data?.content ?? []}
        columns={[
          {
            field: 'approvedAt',
            headerName: '승인일시',
            flex: 1,
            valueFormatter: (v: string) => formatDateTime(v),
          },
          { field: 'merchantName', headerName: '가맹점', flex: 1 },
          { field: 'cardMaskedNumber', headerName: '카드번호', flex: 1 },
          {
            field: 'amount',
            headerName: '금액',
            flex: 1,
            valueFormatter: (v: number) => `${v.toLocaleString('ko-KR')}원`,
          },
          {
            field: 'status',
            headerName: '상태',
            flex: 0.6,
            renderCell: (params: { row: { status: string } }) => {
              const info = getStatusInfo(params.row.status);
              return <Chip label={info.label} color={info.color} size="small" />;
            },
          },
        ]}
      />
    </Box>
  );
};
