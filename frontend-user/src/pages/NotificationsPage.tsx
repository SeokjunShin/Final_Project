import { Box, Button, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api';
import { TableSection } from '@/components/common/TableSection';

export const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        return await notificationsApi.list();
      } catch {
        return [
          { id: 1, category: 'NOTICE', title: '2월 시스템 점검 안내', read: false, createdAt: '2026-02-24' },
          { id: 2, category: 'MESSAGE', title: '문의 답변이 도착했습니다.', read: true, createdAt: '2026-02-23' },
        ];
      }
    },
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        알림센터
      </Typography>
      <TableSection
        rows={data ?? []}
        columns={[
          { field: 'category', headerName: '유형', flex: 1 },
          { field: 'title', headerName: '제목', flex: 2 },
          { field: 'createdAt', headerName: '일시', flex: 1 },
          {
            field: 'read',
            headerName: '읽음',
            flex: 1,
            renderCell: (params) =>
              params.value ? (
                '완료'
              ) : (
                <Button
                  size="small"
                  onClick={async () => {
                    await notificationsApi.read(params.row.id).catch(() => null);
                    queryClient.invalidateQueries({ queryKey: ['notifications'] });
                  }}
                >
                  읽음 처리
                </Button>
              ),
          },
        ]}
      />
    </Box>
  );
};
