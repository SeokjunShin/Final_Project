import { Box, Card, CardContent, Chip, Grid, Stack, Typography, Avatar, LinearProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { dashboardApi } from '@/api';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useAuth } from '@/contexts/AuthContext';

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

const statCards = [
  { key: 'upcomingPayment', label: '이번 달 결제예정', icon: <AccountBalanceWalletIcon />, color: '#d32f2f', format: money },
  { key: 'totalAvailableLimit', label: '사용 가능 한도', icon: <CreditCardIcon />, color: '#1976d2', format: money },
  { key: 'pointBalance', label: '포인트 잔액', icon: <CardGiftcardIcon />, color: '#ff9800', format: (v: number | null | undefined) => `${(v ?? 0).toLocaleString('ko-KR')}P` },
];

export const DashboardPage = () => {
  const { user } = useAuth();
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
      {/* Welcome Section */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', color: '#fff' }}>
        <CardContent sx={{ py: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '1.5rem' }}>
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                안녕하세요, {user?.name || '고객'}님
              </Typography>
              <Typography sx={{ opacity: 0.9 }}>
                오늘도 MyCard와 함께 스마트한 금융생활 되세요.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statCards.map((stat) => (
          <Grid item xs={12} md={4} key={stat.key}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" sx={{ fontSize: 13, mb: 1 }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {stat.format((summary as any)[stat.key])}
                    </Typography>
                  </Box>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                    {stat.icon}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <TrendingUpIcon sx={{ color: '#d32f2f' }} />
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>월별 소비 추이</Typography>
              </Stack>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={summary.monthlySpend ?? []} barCategoryGap="20%">
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} tickFormatter={(v) => `${(v/10000).toFixed(0)}만`} />
                    <Tooltip formatter={(v) => money(Number(v))} cursor={{ fill: 'rgba(211,47,47,0.05)' }} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {(summary.monthlySpend ?? []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index === (summary.monthlySpend?.length ?? 0) - 1 ? '#d32f2f' : '#ffcdd2'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>최근 승인 내역</Typography>
                <Typography component="a" href="/approvals" sx={{ color: '#d32f2f', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
                  전체보기 →
                </Typography>
              </Stack>
              <Stack spacing={1.5} sx={{ flex: 1 }}>
                {(summary.recentApprovals ?? []).slice(0, 5).map((row: any, idx: number) => (
                  <Box
                    key={row.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      bgcolor: idx % 2 === 0 ? '#fafafa' : '#fff',
                      borderRadius: 1.5,
                      border: '1px solid #f0f0f0',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 0.3 }}>
                        {row.merchantName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.approvedAt} · {row.cardMaskedNumber}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={0.5}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: row.status === 'CANCELED' ? '#999' : '#333' }}>
                        {row.status === 'CANCELED' ? '-' : ''}{money(row.amount)}
                      </Typography>
                      <Chip
                        size="small"
                        label={row.status === 'CANCELED' ? '취소' : '승인'}
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: row.status === 'CANCELED' ? '#f5f5f5' : '#ffebee',
                          color: row.status === 'CANCELED' ? '#999' : '#d32f2f',
                        }}
                      />
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
