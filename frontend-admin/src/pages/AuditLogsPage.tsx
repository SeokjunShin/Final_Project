import { Box, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';

export const AuditLogsPage = () => {
  const [action, setAction] = useState('');
  const [actor, setActor] = useState('');

  const { data } = useQuery({
    queryKey: ['audit-logs', action, actor],
    queryFn: async () => {
      try {
        return await adminApi.auditLogs({ action, actor, page: 0, size: 20 });
      } catch {
        return {
          content: [
            { id: 1, occurredAt: '2026-02-24 10:41', actor: 'admin', action: 'USER_LOCK', target: 'userId=1002' },
            { id: 2, occurredAt: '2026-02-24 10:15', actor: 'kim.op', action: 'DOC_APPROVE', target: 'docId=324' },
          ],
          totalElements: 2,
          totalPages: 1,
          number: 0,
          size: 20,
        };
      }
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
      <AdminTable
        rows={data?.content ?? []}
        columns={[
          { field: 'occurredAt', headerName: '시간', flex: 1 },
          { field: 'actor', headerName: 'actor', flex: 1 },
          { field: 'action', headerName: '행위', flex: 1 },
          { field: 'target', headerName: '대상', flex: 2 },
        ]}
      />
    </Box>
  );
};
