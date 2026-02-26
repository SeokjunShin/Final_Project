import { Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';
import { formatDateTime } from '@/utils/dateUtils';

interface User {
  id: number;
  name: string;
  email: string;
  status: string;
  lastLoginAt?: string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return { label: '활성', color: 'success' as const };
    case 'LOCKED':
      return { label: '잠금', color: 'error' as const };
    case 'INACTIVE':
      return { label: '비활성', color: 'default' as const };
    default:
      return { label: status, color: 'default' as const };
  }
};

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
          getRowId={(row: { id: number }) => row.id}
          columns={[
            { field: 'name', headerName: '이름', flex: 1 },
            { field: 'email', headerName: '이메일', flex: 2 },
            {
              field: 'status',
              headerName: '상태',
              flex: 1,
              renderCell: (params: { row: User }) => {
                const info = getStatusInfo(params.row.status);
                return <Chip label={info.label} color={info.color} size="small" />;
              },
            },
            {
              field: 'lastLoginAt',
              headerName: '마지막 로그인',
              flex: 1.5,
              renderCell: (params: { row: User }) => (
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(params.row.lastLoginAt)}
                </Typography>
              ),
            },
            {
              field: 'action',
              headerName: '상태 변경',
              flex: 2,
              renderCell: (params: { row: User }) => (
                <Stack direction="row" spacing={1}>
                  {params.row.status === 'LOCKED' ? (
                    <Button size="small" color="success" onClick={() => updateState(params.row.id, 'ACTIVE')}>
                      잠금해제
                    </Button>
                  ) : (
                    <Button size="small" color="error" onClick={() => updateState(params.row.id, 'LOCKED')}>
                      잠금
                    </Button>
                  )}
                  {params.row.status === 'INACTIVE' ? (
                    <Button size="small" color="success" onClick={() => updateState(params.row.id, 'ACTIVE')}>
                      활성화
                    </Button>
                  ) : (
                    <Button size="small" color="warning" onClick={() => updateState(params.row.id, 'INACTIVE')}>
                      비활성
                    </Button>
                  )}
                </Stack>
              ),
            },
          ]}
        />
      )}
    </Box>
  );
};
