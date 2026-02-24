import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dashboardApi } from '@/api';
import platinumCard from '@/assets/cards/mycard-platinum.svg';
import checkCard from '@/assets/cards/mycard-check.svg';

const fallback = {
  upcomingPayment: 1280000,
  totalAvailableLimit: 5320000,
  pointBalance: 15200,
  recentApprovals: [
    { id: 1, approvedAt: '2026-02-23 10:11', merchantName: '스타벅스', cardMaskedNumber: '****-5678', amount: 6900, status: 'APPROVED' },
    { id: 2, approvedAt: '2026-02-22 18:40', merchantName: '쿠팡', cardMaskedNumber: '****-5678', amount: 85000, status: 'APPROVED' },
    { id: 3, approvedAt: '2026-02-21 08:14', merchantName: 'GS25', cardMaskedNumber: '****-8844', amount: 7100, status: 'APPROVED' },
    { id: 4, approvedAt: '2026-02-20 22:01', merchantName: '넷플릭스', cardMaskedNumber: '****-8844', amount: 17000, status: 'APPROVED' },
    { id: 5, approvedAt: '2026-02-20 11:35', merchantName: '카카오택시', cardMaskedNumber: '****-8844', amount: 12800, status: 'CANCELED' },
  ],
  monthlySpend: [
    { month: '11월', amount: 610000 },
    { month: '12월', amount: 770000 },
    { month: '1월', amount: 840000 },
    { month: '2월', amount: 520000 },
    { month: '3월', amount: 690000 },
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
      <Typography variant="h5" sx={{ mb: 2 }}>
        대시보드
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 1.5 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box component="img" src={platinumCard} alt="MyCard Platinum" sx={{ width: { xs: '100%', sm: 320 }, borderRadius: 2 }} />
                <Box component="img" src={checkCard} alt="MyCard Check" sx={{ width: { xs: '100%', sm: 320 }, borderRadius: 2 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2}>
            {[
              ['결제예정액', money(summary.upcomingPayment)],
              ['사용가능한도', money(summary.totalAvailableLimit)],
              ['포인트', `${(summary.pointBalance ?? 0).toLocaleString('ko-KR')}P`],
            ].map(([title, value]) => (
              <Grid item xs={12} key={title}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                      {title}
                    </Typography>
                    <Typography variant="h6">{value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 1.5, fontWeight: 700 }}>월별 소비 추이</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={summary.monthlySpend ?? []}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v) => money(Number(v))} />
                    <Bar dataKey="amount" fill="#1f56bd" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography sx={{ fontWeight: 700 }}>최근 승인 5건</Typography>
                <Button size="small" href="/approvals">
                  전체보기
                </Button>
              </Stack>
              <Stack spacing={1.2}>
                {(summary.recentApprovals ?? []).slice(0, 5).map((row: any) => (
                  <Box
                    key={row.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 1,
                      p: 1.2,
                      border: '1px solid #e2eaf8',
                      borderRadius: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.merchantName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.approvedAt}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={0.5}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {money(row.amount)}
                      </Typography>
                      <Chip size="small" color={row.status === 'CANCELED' ? 'default' : 'primary'} label={row.status === 'CANCELED' ? '취소' : '승인'} />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
