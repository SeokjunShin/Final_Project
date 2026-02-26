import { Box, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface DashboardData {
  todayInquiries?: number;
  pendingDocuments?: number;
  unreadMessages?: number;
  lockedUsers?: number;
  recentInquiries?: { id: number; title: string; status: string; assignee?: string; createdAt: string }[];
  // Operator dashboard fields
  unassignedInquiries?: number;
  myInquiries?: number;
  openInquiries?: number;
  inProgressInquiries?: number;
  recentUnassigned?: { id: number; title: string; status: string; userName?: string; createdAt: string }[];
  myRecentInquiries?: { id: number; title: string; status: string; userName?: string; createdAt: string }[];
}

export const AdminDashboardPage = () => {
  const { user } = useAdminAuth();
  const isOperator = user?.role === 'OPERATOR';

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard', isOperator],
    queryFn: async () => {
      // OPERATOR인 경우 operator dashboard API 호출
      if (isOperator) {
        return await adminApi.operatorDashboard();
      }
      return await adminApi.dashboard();
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">대시보드 데이터를 불러올 수 없습니다.</Typography>
      </Box>
    );
  }

  // OPERATOR용 대시보드
  if (isOperator) {
    const operatorStats = [
      ['미배정 문의', data.unassignedInquiries ?? 0],
      ['내 배정 문의', data.myInquiries ?? 0],
      ['대기 중 문의', data.openInquiries ?? 0],
      ['진행 중 문의', data.inProgressInquiries ?? 0],
    ];

    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          상담원 대시보드
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {operatorStats.map(([title, value]) => (
            <Grid item xs={12} md={3} key={String(title)}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">{title}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <AdminTable
              title="미배정 문의"
              rows={data.recentUnassigned ?? []}
              columns={[
                { field: 'title', headerName: '제목', flex: 2 },
                { field: 'userName', headerName: '작성자', flex: 1 },
                { field: 'status', headerName: '상태', flex: 1 },
                { field: 'createdAt', headerName: '접수일', flex: 1 },
              ]}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <AdminTable
              title="내 담당 문의"
              rows={data.myRecentInquiries ?? []}
              columns={[
                { field: 'title', headerName: '제목', flex: 2 },
                { field: 'userName', headerName: '작성자', flex: 1 },
                { field: 'status', headerName: '상태', flex: 1 },
                { field: 'createdAt', headerName: '접수일', flex: 1 },
              ]}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // ADMIN용 대시보드
  const stats = [
    ['오늘 문의', data.todayInquiries ?? 0],
    ['문서 대기', data.pendingDocuments ?? 0],
    ['미처리 메시지', data.unreadMessages ?? 0],
    ['잠금 사용자', data.lockedUsers ?? 0],
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        운영 대시보드
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {stats.map(([title, value]) => (
          <Grid item xs={12} md={3} key={String(title)}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">{title}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <AdminTable
        title="최근 문의 큐"
        rows={data.recentInquiries ?? []}
        columns={[
          { field: 'title', headerName: '제목', flex: 2 },
          { field: 'status', headerName: '상태', flex: 1 },
          { field: 'assignee', headerName: '담당자', flex: 1 },
          { field: 'createdAt', headerName: '접수일', flex: 1 },
        ]}
      />
    </Box>
  );
};
