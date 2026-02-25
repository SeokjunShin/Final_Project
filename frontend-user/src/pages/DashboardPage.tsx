import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography, Avatar, Skeleton } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { dashboardApi, cardsApi, pointsApi } from '@/api';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddCardIcon from '@mui/icons-material/AddCard';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '@/contexts/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import { CreditCard as CreditCardVisual } from '@/components/common/CreditCard';

const money = (v: number | undefined | null) => `${(v ?? 0).toLocaleString('ko-KR')}원`;

export const DashboardPage = () => {
  const { user } = useAuth();

  // 대시보드 요약 데이터
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['user-dashboard'],
    queryFn: async () => {
      try {
        return await dashboardApi.getSummary();
      } catch {
        return null;
      }
    },
  });

  // 카드 목록 조회
  const { data: cardsData, isLoading: cardsLoading } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      try {
        return await cardsApi.list();
      } catch {
        return [];
      }
    },
  });

  // 포인트 잔액 조회 (실시간 연동)
  const { data: pointsData } = useQuery({
    queryKey: ['points-balance'],
    queryFn: async () => {
      try {
        return await pointsApi.balance();
      } catch {
        return { totalPoints: 0, availablePoints: 0, expiringPoints: 0, expiringDate: null };
      }
    },
  });

  const cards = cardsData ?? [];
  const hasCards = cards.length > 0;
  const pointBalance = pointsData?.availablePoints ?? dashboardData?.pointBalance ?? 0;

  // 카드가 있을 때만 유효한 데이터
  const upcomingPayment = hasCards ? (dashboardData?.upcomingPayment ?? 0) : 0;
  const totalAvailableLimit = hasCards
    ? cards.reduce((sum: number, card: any) => sum + (card.availableLimit || 0), 0)
    : 0;

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

      {/* My Cards Section */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>내 카드</Typography>
      {cardsLoading ? (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rounded" height={160} />
            </Grid>
          ))}
        </Grid>
      ) : hasCards ? (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {cards.slice(0, 2).map((card: any) => {
            const cardName = card.cardAlias || card.cardType || 'MyCard';
            return (
              <Grid item xs={12} md={6} key={card.id}>
                <Card sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                  <CreditCardVisual
                    cardName={cardName}
                    cardNumber={card.cardNumberMasked}
                    size="small"
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.95rem' }}>{cardName}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', mb: 1, fontSize: '0.8rem' }}>
                      {card.cardNumberMasked || '****-****-****-****'}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>사용가능</Typography>
                        <Typography sx={{ fontWeight: 600, color: '#d32f2f', fontSize: '0.85rem' }}>
                          {(card.availableLimit || 0).toLocaleString()}원
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>한도</Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {(card.creditLimit || 0).toLocaleString()}원
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            );
          })}
          {cards.length > 2 && (
            <Grid item xs={12}>
              <Button
                component={RouterLink}
                to="/cards"
                fullWidth
                endIcon={<ArrowForwardIcon />}
                sx={{ color: '#d32f2f' }}
              >
                모든 카드 보기 ({cards.length}개)
              </Button>
            </Grid>
          )}
        </Grid>
      ) : (
        <Card sx={{ mb: 3, textAlign: 'center', py: 4, bgcolor: '#fafafa' }}>
          <AddCardIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
          <Typography sx={{ mb: 1, color: '#666' }}>아직 보유한 카드가 없습니다</Typography>
          <Button
            component={RouterLink}
            to="/cards/applications"
            variant="contained"
            sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
          >
            카드 신청하기
          </Button>
        </Card>
      )}

      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" sx={{ fontSize: 13, mb: 1 }}>이번 달 결제예정</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {hasCards ? money(upcomingPayment) : '-'}
                  </Typography>
                </Box>
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#d32f2f15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d32f2f' }}>
                  <AccountBalanceWalletIcon />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" sx={{ fontSize: 13, mb: 1 }}>사용 가능 한도</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {hasCards ? money(totalAvailableLimit) : '-'}
                  </Typography>
                </Box>
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#1976d215', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1976d2' }}>
                  <CreditCardIcon />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card
            component={RouterLink}
            to="/points"
            sx={{ height: '100%', textDecoration: 'none', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" sx={{ fontSize: 13, mb: 1 }}>포인트 잔액</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {pointBalance.toLocaleString('ko-KR')}P
                  </Typography>
                </Box>
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#ff980015', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff9800' }}>
                  <CardGiftcardIcon />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section - only show if user has cards */}
      {hasCards && (
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
                    <BarChart data={dashboardData?.monthlySpend ?? []} barCategoryGap="20%">
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} tickFormatter={(v) => `${(v/10000).toFixed(0)}만`} />
                      <Tooltip formatter={(v) => money(Number(v))} cursor={{ fill: 'rgba(211,47,47,0.05)' }} />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                        {(dashboardData?.monthlySpend ?? []).map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={index === (dashboardData?.monthlySpend?.length ?? 0) - 1 ? '#d32f2f' : '#ffcdd2'} />
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
                  <Typography component={RouterLink} to="/approvals" sx={{ color: '#d32f2f', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
                    전체보기 →
                  </Typography>
                </Stack>
                <Stack spacing={1.5} sx={{ flex: 1 }}>
                  {(dashboardData?.recentApprovals ?? []).slice(0, 5).map((row: any, idx: number) => (
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
                  {(dashboardData?.recentApprovals ?? []).length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4, color: '#999' }}>
                      <Typography>아직 승인 내역이 없습니다</Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
