import { Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const PAGE_SIZE = 20;

export const AuditLogsPage = () => {
  const [action, setAction] = useState('');
  const [actor, setActor] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', action, actor, page],
    queryFn: async () => {
      return await adminApi.auditLogs({ action, actor, page, size: PAGE_SIZE });
    },
  });

  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        감사로그
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="행위"
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(0); }}
          size="small"
        />
        <TextField
          label="Actor"
          value={actor}
          onChange={(e) => { setActor(e.target.value); setPage(0); }}
          size="small"
        />
      </Stack>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">감사로그를 불러올 수 없습니다.</Typography>
        </Box>
      ) : (!data?.content || data.content.length === 0) ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">감사로그가 없습니다.</Typography>
        </Box>
      ) : (
        <>
          <AdminTable
            rows={data.content}
            columns={[
              { field: 'occurredAt', headerName: '시간', flex: 1 },
              { field: 'actor', headerName: 'Actor', flex: 1 },
              { field: 'action', headerName: '행위', flex: 1 },
              { field: 'target', headerName: '대상', flex: 2 },
            ]}
          />
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              총 {totalElements}건 중 {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalElements)}건
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                startIcon={<NavigateBeforeIcon />}
              >
                이전
              </Button>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                {page + 1} / {totalPages}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
                endIcon={<NavigateNextIcon />}
              >
                다음
              </Button>
            </Stack>
          </Stack>
        </>
      )}
    </Box>
  );
};
