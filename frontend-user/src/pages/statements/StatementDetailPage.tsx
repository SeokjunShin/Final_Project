import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { statementApi } from '@/api';
import { TableSection } from '@/components/common/TableSection';

export const StatementDetailPage = () => {
  const params = useParams();
  const statementId = Number(params.id);

  const { data } = useQuery({
    queryKey: ['statement-detail', statementId],
    queryFn: async () => {
      try {
        return await statementApi.detail(statementId);
      } catch {
        return {
          id: statementId,
          billingMonth: '2026-02',
          cardName: 'MyCard Platinum',
          cardMaskedNumber: '1234-****-****-5678',
          dueDate: '2026-02-25',
          totalAmount: 348100,
          paidAmount: 0,
          status: 'DUE',
          transactions: [
            { id: 1, approvedAt: '2026-02-21 12:13', merchantName: '카페', amount: 5500, status: 'APPROVED' },
            { id: 2, approvedAt: '2026-02-20 19:22', merchantName: '마트', amount: 89300, status: 'APPROVED' },
          ],
        };
      }
    },
  });

  if (!data) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        명세서 상세
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
            <Typography>청구월: {data.billingMonth}</Typography>
            <Typography>결제일: {data.dueDate}</Typography>
            <Typography>총 청구: {data.totalAmount.toLocaleString('ko-KR')}원</Typography>
            <Typography>결제상태: {data.status}</Typography>
          </Stack>
        </CardContent>
      </Card>
      <TableSection
        rows={data.transactions}
        columns={[
          { field: 'approvedAt', headerName: '승인일시', flex: 1 },
          { field: 'merchantName', headerName: '가맹점', flex: 1 },
          { field: 'amount', headerName: '금액', flex: 1, valueFormatter: (v: number) => `${v.toLocaleString('ko-KR')}원` },
          { field: 'status', headerName: '상태', flex: 1 },
        ]}
      />
    </Box>
  );
};
