import { Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';

export const DocumentsPage = () => {
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();
  const { show } = useAdminSnackbar();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-documents', status],
    queryFn: async () => {
      return await adminApi.documents({ status });
    },
  });

  const transition = async (id: number, next: 'APPROVED' | 'REJECTED') => {
    try {
      await adminApi.documentTransition(id, next);
      show(`문서 상태가 ${next}로 변경되었습니다.`, 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
    } catch {
      show('문서 상태 변경에 실패했습니다.', 'error');
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
          문서 검토
        </Typography>
        <TextField label="상태" value={status} onChange={(e) => setStatus(e.target.value)} />
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">문서 데이터를 불러올 수 없습니다.</Typography>
        </Box>
      ) : (!data?.content || data.content.length === 0) ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">검토 대기중인 문서가 없습니다.</Typography>
        </Box>
      ) : (
        <AdminTable
          rows={data.content}
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
      )}
    </Box>
  );
};
