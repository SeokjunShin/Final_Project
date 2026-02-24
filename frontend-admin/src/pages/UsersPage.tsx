import { Box, Button, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';

export const UsersPage = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        return await adminApi.users();
      } catch {
        return [
          { id: 1001, name: '홍길동', status: 'ACTIVE', email: 'user1@mycard.local' },
          { id: 1002, name: '김민수', status: 'LOCKED', email: 'user2@mycard.local' },
        ];
      }
    },
  });

  const updateState = async (id: number, state: string) => {
    await adminApi.updateUserState(id, state).catch(() => null);
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        사용자 관리
      </Typography>
      <AdminTable
        rows={data ?? []}
        columns={[
          { field: 'name', headerName: '이름', flex: 1 },
          { field: 'email', headerName: '이메일', flex: 2 },
          { field: 'status', headerName: '상태', flex: 1 },
          {
            field: 'action',
            headerName: '상태 변경',
            flex: 2,
            renderCell: (params) => (
              <>
                <Button size="small" onClick={() => updateState(params.row.id, 'LOCKED')}>
                  잠금
                </Button>
                <Button size="small" onClick={() => updateState(params.row.id, 'INACTIVE')}>
                  비활성
                </Button>
              </>
            ),
          },
        ]}
      />
    </Box>
  );
};
