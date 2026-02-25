import { Box, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';

export const AuditLogsPage = () => {
  const [action, setAction] = useState('');
  const [actor, setActor] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', action, actor],
    queryFn: async () => {
      return await adminApi.auditLogs({ action, actor, page: 0, size: 20 });
    },
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        감사로그
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField label="행위" value={action} onChange={(e) => setAction(e.target.value)} />
        <TextField label="actor" value={actor} onChange={(e) => setActor(e.target.value)} />
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
        <AdminTable
          rows={data.content}
          columns={[
            { field: 'occurredAt', headerName: '시간', flex: 1 },
            { field: 'actor', headerName: 'actor', flex: 1 },
            { field: 'action', headerName: '행위', flex: 1 },
            { field: 'target', headerName: '대상', flex: 2 },
          ]}
        />
      )}
    </Box>
  );
};
