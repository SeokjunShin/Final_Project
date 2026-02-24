import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { AdminTable } from '@/components/common/AdminTable';

const queueRows = [
  { id: 1, title: '한도 상향 문의', status: 'RECEIVED', assignee: 'kim.op', createdAt: '2026-02-24' },
  { id: 2, title: '문서 재제출 건', status: 'IN_PROGRESS', assignee: 'lee.op', createdAt: '2026-02-23' },
];

export const AdminDashboardPage = () => {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        운영 대시보드
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          ['오늘 문의', '42'],
          ['문서 대기', '18'],
          ['미처리 메시지', '7'],
          ['잠금 사용자', '3'],
        ].map(([title, value]) => (
          <Grid item xs={12} md={3} key={title}>
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
        rows={queueRows}
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
