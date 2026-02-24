import { Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
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
          year: 2026,
          month: 3,
          dueDate: '2026-04-15',
          totalAmount: 348100,
          paidAmount: 0,
          status: 'ISSUED',
          items: [
            { id: 1, transactionDate: '2026-03-21 12:13', merchantName: '스타벅스', categoryName: 'CAFE', amount: 5500, status: 'APPROVED' },
            { id: 2, transactionDate: '2026-03-20 19:22', merchantName: '이마트', categoryName: 'MART', amount: 89300, status: 'APPROVED' },
          ],
        };
      }
    },
  });

  if (!data) return null;

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 2 }}>
        <Typography variant="h5">명세서 상세</Typography>
        <Button
          variant="contained"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={async () => {
            const blob = await statementApi.downloadCsv(statementId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `statement_${statementId}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          CSV 다운로드
        </Button>
      </Stack>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} divider={<Divider orientation="vertical" flexItem />}>
            <Box>
              <Typography variant="caption" color="text.secondary">청구월</Typography>
              <Typography sx={{ fontWeight: 700 }}>{data.year}-{String(data.month).padStart(2, '0')}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">결제일</Typography>
              <Typography sx={{ fontWeight: 700 }}>{data.dueDate}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">총 청구금액</Typography>
              <Typography sx={{ fontWeight: 700 }}>{Number(data.totalAmount).toLocaleString('ko-KR')}원</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">상태</Typography>
              <Typography sx={{ fontWeight: 700 }}>{data.status}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableSection
            rows={data.items}
            columns={[
              { field: 'transactionDate', headerName: '승인일시', flex: 1.2 },
              { field: 'merchantName', headerName: '가맹점', flex: 1 },
              { field: 'categoryName', headerName: '업종', flex: 1 },
              { field: 'amount', headerName: '금액', flex: 1, valueFormatter: (v: number) => `${Number(v ?? 0).toLocaleString('ko-KR')}원` },
              { field: 'status', headerName: '상태', flex: 0.7 },
            ]}
          />
        </CardContent>
      </Card>
    </Box>
  );
};
