import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';

export const UsersPage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      return await adminApi.users();
    },
  });

  const updateState = async (id: number, state: string) => {
    await adminApi.updateUserState(id, state).catch(() => null);
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
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
        <Typography color="text.secondary">사용자 데이터를 불러올 수 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        사용자 관리
      </Typography>
      {(!data || data.length === 0) ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">등록된 사용자가 없습니다.</Typography>
        </Box>
      ) : (
        <AdminTable
          rows={data}
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
      )}
    </Box>
  );
};
