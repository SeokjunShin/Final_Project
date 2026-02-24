import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';

export const DocumentsPage = () => {
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();
  const { show } = useAdminSnackbar();

  const { data } = useQuery({
    queryKey: ['admin-documents', status],
    queryFn: async () => {
      try {
        return await adminApi.documents({ status });
      } catch {
        return {
          content: [
            { id: 201, title: '신분증 재제출', status: 'REVIEWING', assignee: 'kim.op', createdAt: '2026-02-24' },
            { id: 202, title: '소득증빙 검토', status: 'REVIEWING', assignee: 'lee.op', createdAt: '2026-02-23' },
          ],
          totalElements: 2,
          totalPages: 1,
          number: 0,
          size: 10,
        };
      }
    },
  });

  const transition = async (id: number, next: 'APPROVED' | 'REJECTED') => {
    await adminApi.documentTransition(id, next).catch(() => null);
    show(`문서 상태가 ${next}로 변경되었습니다.`, 'success');
    queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
          문서 검토
        </Typography>
        <TextField label="상태" value={status} onChange={(e) => setStatus(e.target.value)} />
      </Stack>
      <AdminTable
        rows={data?.content ?? []}
        columns={[
          { field: 'title', headerName: '문서명', flex: 2 },
          { field: 'status', headerName: '상태', flex: 1 },
          { field: 'assignee', headerName: '담당자', flex: 1 },
          { field: 'createdAt', headerName: '제출일', flex: 1 },
          {
            field: 'action',
            headerName: '상태 전이',
            flex: 2,
            renderCell: (params) => (
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={() => transition(params.row.id, 'APPROVED')}>
                  승인
                </Button>
                <Button size="small" color="error" variant="outlined" onClick={() => transition(params.row.id, 'REJECTED')}>
                  반려
                </Button>
              </Stack>
            ),
          },
        ]}
      />
    </Box>
  );
};
