import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { statementApi } from '@/api';
import { TableSection } from '@/components/common/TableSection';

const fallbackRows = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  billingMonth: `2026-${String((i % 12) + 1).padStart(2, '0')}`,
  cardName: 'MyCard Platinum',
  cardMaskedNumber: '1234-****-****-5678',
  dueDate: '2026-02-25',
  totalAmount: 120000 + i * 17000,
  status: i % 3 === 0 ? 'PAID' : 'DUE',
}));

export const StatementListPage = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [period, setPeriod] = useState('2026-01');
  const [card, setCard] = useState('');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['statements', page, size, period, card],
    queryFn: async () => {
      try {
        return await statementApi.list({ page, size, period, card });
      } catch {
        return { content: fallbackRows.slice(page * size, page * size + size), totalElements: fallbackRows.length, totalPages: 2, number: page, size };
      }
    },
  });

  const columns = useMemo(
    () => [
      { field: 'billingMonth', headerName: '청구월', flex: 1 },
      { field: 'cardName', headerName: '카드', flex: 1 },
      {
        field: 'totalAmount',
        headerName: '결제예정액',
        flex: 1,
        valueFormatter: (v: number) => `${v.toLocaleString('ko-KR')}원`,
      },
      { field: 'dueDate', headerName: '결제일', flex: 1 },
      { field: 'status', headerName: '상태', flex: 1 },
    ],
    [],
  );

  const downloadCsv = async () => {
    try {
      const blob = await statementApi.downloadCsv({ period, card });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statements_${period}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const sample = 'id,billingMonth,totalAmount\n1,2026-01,128000';
      const url = URL.createObjectURL(new Blob([sample], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'statements_sample.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        이용대금 명세서
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="기간(YYYY-MM)" value={period} onChange={(e) => setPeriod(e.target.value)} />
            <TextField label="카드" value={card} onChange={(e) => setCard(e.target.value)} />
            <Button variant="outlined" onClick={() => setPage(0)}>
              필터 적용
            </Button>
            <Button variant="contained" onClick={downloadCsv}>
              다운로드 CSV
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <TableSection
        loading={isLoading}
        rows={data?.content ?? []}
        columns={columns}
        rowCount={data?.totalElements ?? 0}
        paginationMode="server"
        paginationModel={{ page, pageSize: size }}
        onPaginationModelChange={(m) => {
          setPage(m.page);
          setSize(m.pageSize);
        }}
        onRowClick={(p) => navigate(`/statements/${p.id}`)}
      />
    </Box>
  );
};
