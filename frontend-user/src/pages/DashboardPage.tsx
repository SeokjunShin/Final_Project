import { Box, Button, Card, CardContent, Grid, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dashboardApi } from '@/api';

const fallback = {
  dueAmount: 1280000,
  availableLimit: 5320000,
  points: 15200,
  recentApprovals: [
    { id: 1, approvedAt: '2026-02-23 10:11', merchantName: '편의점', cardMaskedNumber: '****-9012', amount: 6900, status: 'APPROVED' },
    { id: 2, approvedAt: '2026-02-22 18:40', merchantName: '온라인쇼핑', cardMaskedNumber: '****-9012', amount: 85000, status: 'APPROVED' },
  ],
  monthlySpend: [
    { month: '10월', amount: 710000 },
    { month: '11월', amount: 820000 },
    { month: '12월', amount: 620000 },
    { month: '1월', amount: 940000 },
    { month: '2월', amount: 530000 },
  ],
};

const money = (v: number | undefined | null) => `${(v ?? 0).toLocaleString('ko-KR')}원`;

export const DashboardPage = () => {
  const { data } = useQuery({
    queryKey: ['user-dashboard'],
    queryFn: async () => {
      try {
        return await dashboardApi.getSummary();
      } catch {
        return fallback;
      }
    },
  });

  const summary = data ?? fallback;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        대시보드
      </Typography>
      <Grid container spacing={2}>
        {[
          ['결제예정액', money(summary.dueAmount)],
          ['사용가능한도', money(summary.availableLimit)],
          ['포인트', `${(summary.points ?? 0).toLocaleString('ko-KR')}P`],
        ].map(([title, value]) => (
          <Grid item xs={12} md={4} key={title}>
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
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 1, fontWeight: 700 }}>월별 소비 추이</Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={summary.monthlySpend}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v) => money(Number(v))} />
                    <Bar dataKey="amount" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 1, fontWeight: 700 }}>최근 승인 5건</Typography>
              {(summary.recentApprovals ?? []).map((row) => (
                <Box key={row.id} sx={{ mb: 1 }}>
                  <Typography variant="body2">{row.merchantName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.approvedAt} · {money(row.amount)}
                  </Typography>
                </Box>
              ))}
              <Button size="small" href="/approvals">
                승인내역 보기
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
