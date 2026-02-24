import { Box, Button, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';

export const EventsPage = () => {
  const { data } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      try {
        return await adminApi.events();
      } catch {
        return [
          { id: 1, title: '봄맞이 캐시백 이벤트', applicants: 1288, winners: 0, status: 'OPEN' },
          { id: 2, title: '신규회원 포인트 이벤트', applicants: 542, winners: 30, status: 'CLOSED' },
        ];
      }
    },
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        이벤트 관리
      </Typography>
      <AdminTable
        rows={data ?? []}
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
              <Button size="small" onClick={() => adminApi.drawWinners(params.row.id).catch(() => null)}>
                당첨 처리
              </Button>
            ),
          },
        ]}
      />
    </Box>
  );
};
