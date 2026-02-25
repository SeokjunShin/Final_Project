import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Card, CardContent, Chip, Grid, Stack, TextField, Typography, LinearProgress } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { pointsApi } from '@/api';
import { useSnackbar } from '@/contexts/SnackbarContext';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const schema = z.object({
  amount: z.coerce.number().min(1000, '1000P 이상 입력하세요.'),
});

type FormValues = z.infer<typeof schema>;

const getTypeInfo = (type: string) => {
  switch (type) {
    case 'EARN': return { label: '적립', color: '#4caf50', icon: <TrendingUpIcon sx={{ fontSize: 18 }} />, prefix: '+' };
    case 'SPEND': return { label: '사용', color: '#f44336', icon: <TrendingDownIcon sx={{ fontSize: 18 }} />, prefix: '' };
    case 'CONVERT': return { label: '전환', color: '#ff9800', icon: <SwapHorizIcon sx={{ fontSize: 18 }} />, prefix: '' };
    case 'ADJUST': return { label: '조정', color: '#2196f3', icon: <CardGiftcardIcon sx={{ fontSize: 18 }} />, prefix: '+' };
    default: return { label: type, color: '#666', icon: <CardGiftcardIcon sx={{ fontSize: 18 }} />, prefix: '' };
  }
};

export const PointsPage = () => {
  const { show } = useSnackbar();
  const queryClient = useQueryClient();

  // 포인트 잔액 조회
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['points-balance'],
    queryFn: async () => {
      try {
        return await pointsApi.balance();
      } catch {
        return { totalPoints: 0, availablePoints: 0, expiringPoints: 0, expiringDate: null };
      }
    },
  });

  // 포인트 내역 조회
  const { data: ledger, isLoading: ledgerLoading } = useQuery({
    queryKey: ['points-ledger'],
    queryFn: async () => {
      try {
        return await pointsApi.ledger({ page: 0, size: 20 });
      } catch {
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 20,
        };
      }
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (form: FormValues) => {
    if ((balance?.availablePoints ?? 0) < form.amount) {
      show('포인트 잔액이 부족합니다.', 'error');
      return;
    }
    try {
      await pointsApi.convert(form.amount);
      show('포인트 전환 요청이 접수되었습니다.', 'success');
      reset();
      queryClient.invalidateQueries({ queryKey: ['points-balance'] });
      queryClient.invalidateQueries({ queryKey: ['points-ledger'] });
    } catch {
      show('포인트 전환에 실패했습니다.', 'error');
    }
  };

  const pointBalance = balance?.availablePoints ?? 0;
  const transactions = ledger?.content ?? [];

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <CardGiftcardIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>포인트</Typography>
      </Stack>

      <Grid container spacing={3}>
        {/* 포인트 잔액 카드 */}
        <Grid item xs={12} md={5}>
          <Card sx={{ background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', color: '#fff', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ opacity: 0.9, mb: 1 }}>보유 포인트</Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                {balanceLoading ? '...' : pointBalance.toLocaleString('ko-KR')}
                <Typography component="span" sx={{ fontSize: '1.5rem', ml: 0.5 }}>P</Typography>
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                1P = 1원 · 최소 1,000P부터 전환 가능
              </Typography>
            </CardContent>
          </Card>

          {/* 포인트 전환 폼 */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <SwapHorizIcon sx={{ color: '#ff9800' }} />
                <Typography sx={{ fontWeight: 700 }}>포인트 현금 전환</Typography>
              </Stack>
              <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2}>
                <TextField
                  label="전환할 포인트"
                  placeholder="1000"
                  {...register('amount')}
                  error={!!errors.amount}
                  helperText={errors.amount?.message || `보유: ${pointBalance.toLocaleString()}P`}
                  fullWidth
                  InputProps={{
                    endAdornment: <Typography color="text.secondary">P</Typography>,
                  }}
                />
                <Button
                  variant="contained"
                  type="submit"
                  fullWidth
                  disabled={pointBalance < 1000}
                  sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
                >
                  현금으로 전환
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 포인트 내역 */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 2 }}>포인트 내역</Typography>
              
              {ledgerLoading ? (
                <LinearProgress sx={{ my: 4 }} />
              ) : transactions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: '#999' }}>
                  <CardGiftcardIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography>포인트 내역이 없습니다</Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {transactions.map((item: any) => {
                    const typeInfo = getTypeInfo(item.type || item.entryType);
                    return (
                      <Box
                        key={item.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          bgcolor: '#fafafa',
                          borderRadius: 2,
                          border: '1px solid #f0f0f0',
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              bgcolor: `${typeInfo.color}15`,
                              color: typeInfo.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {typeInfo.icon}
                          </Box>
                          <Box>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.3 }}>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                {item.description || item.memo || typeInfo.label}
                              </Typography>
                              <Chip
                                label={typeInfo.label}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  bgcolor: `${typeInfo.color}15`,
                                  color: typeInfo.color,
                                  fontWeight: 600,
                                }}
                              />
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {item.createdAt}
                            </Typography>
                          </Box>
                        </Stack>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: item.amount > 0 ? '#4caf50' : '#f44336',
                          }}
                        >
                          {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}P
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
