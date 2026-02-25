import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';

export const EventsPage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      return await adminApi.events();
    },
  });

  const handleDraw = async (id: number) => {
    await adminApi.drawWinners(id).catch(() => null);
    queryClient.invalidateQueries({ queryKey: ['admin-events'] });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">이벤트 데이터를 불러올 수 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        이벤트 관리
      </Typography>
      {(!data || data.length === 0) ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">등록된 이벤트가 없습니다.</Typography>
        </Box>
      ) : (
        <AdminTable
          rows={data}
          columns={[
            { field: 'title', headerName: '이벤트명', flex: 2 },
            { field: 'applicants', headerName: '응모자', flex: 1 },
            { field: 'winners', headerName: '당첨자', flex: 1 },
            { field: 'status', headerName: '상태', flex: 1 },
            {
              field: 'action',
              headerName: '처리',
              flex: 1,
              renderCell: (params) => (
                <Button size="small" onClick={() => handleDraw(params.row.id)}>
                  당첨 처리
                </Button>
              ),
            },
          ]}
        />
      )}
    </Box>
  );
};
