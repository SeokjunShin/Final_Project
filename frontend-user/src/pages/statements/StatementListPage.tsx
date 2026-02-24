import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { statementApi } from '@/api';
import { TableSection } from '@/components/common/TableSection';

const fallbackRows = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  year: 2026,
  month: (i % 12) + 1,
  dueDate: '2026-04-15',
  totalAmount: 120000 + i * 17000,
  paidAmount: 0,
  status: i % 3 === 0 ? 'PAID' : 'ISSUED',
}));

export const StatementListPage = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [cardId, setCardId] = useState('');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['statements', page, size, fromDate, toDate, cardId],
    queryFn: async () => {
      try {
        return await statementApi.list({
          page,
          size,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          cardId: cardId ? Number(cardId) : undefined,
        });
      } catch {
        return {
          content: fallbackRows.slice(page * size, page * size + size),
          totalElements: fallbackRows.length,
          totalPages: Math.ceil(fallbackRows.length / size),
          number: page,
          size,
        };
      }
    },
  });

  const columns = useMemo(
    () => [
      {
        field: 'period',
        headerName: '청구월',
        flex: 1,
        valueGetter: (_: any, row: any) => `${row.year}-${String(row.month).padStart(2, '0')}`,
      },
      {
        field: 'totalAmount',
        headerName: '결제예정액',
        flex: 1,
        valueFormatter: (v: number) => `${Number(v ?? 0).toLocaleString('ko-KR')}원`,
      },
      { field: 'dueDate', headerName: '결제일', flex: 1 },
      { field: 'status', headerName: '상태', flex: 1 },
      {
        field: 'download',
        headerName: '다운로드',
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params: any) => (
          <Button
            size="small"
            startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
            onClick={async (e) => {
              e.stopPropagation();
              const blob = await statementApi.downloadCsv(params.row.id);
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `statement_${params.row.id}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            CSV
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        이용대금 명세서
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', lg: 'center' }}>
            <TextField
              label="시작일"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="종료일"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField label="카드 ID" value={cardId} onChange={(e) => setCardId(e.target.value)} />
            <Button variant="outlined" onClick={() => setPage(0)}>
              조회
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableSection
            loading={isLoading}
            rows={data?.content ?? []}
            columns={columns as any}
            rowCount={data?.totalElements ?? 0}
            paginationMode="server"
            paginationModel={{ page, pageSize: size }}
            onPaginationModelChange={(m) => {
              setPage(m.page);
              setSize(m.pageSize);
            }}
            onRowClick={(p) => navigate(`/statements/${p.id}`)}
          />
        </CardContent>
      </Card>
    </Box>
  );
};
