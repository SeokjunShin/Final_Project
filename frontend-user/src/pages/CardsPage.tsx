import { Box, Button, Card, CardContent, FormControlLabel, Grid, Stack, Switch, Typography, Chip } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cardsApi } from '@/api';
import { useSnackbar } from '@/contexts/SnackbarContext';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PublicIcon from '@mui/icons-material/Public';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddCardIcon from '@mui/icons-material/AddCard';
import { Link as RouterLink } from 'react-router-dom';
import { CreditCard as CreditCardVisual } from '@/components/common/CreditCard';

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'ACTIVE': return { label: '정상', color: 'success' as const };
    case 'SUSPENDED': return { label: '정지', color: 'warning' as const };
    case 'LOST': return { label: '분실', color: 'error' as const };
    case 'REISSUE_REQUESTED': return { label: '재발급 신청', color: 'info' as const };
    case 'REISSUED': return { label: '재발급 완료', color: 'default' as const };
    default: return { label: status, color: 'default' as const };
  }
};

export const CardsPage = () => {
  const { show } = useSnackbar();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      try {
        return await cardsApi.list();
      } catch {
        return [];
      }
    },
  });

  const cards = data ?? [];

  if (cards.length === 0) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <CreditCardIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>카드관리</Typography>
        </Stack>
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <AddCardIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1, color: '#666' }}>아직 보유한 카드가 없습니다</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            MyCard를 신청하고 다양한 혜택을 누려보세요!
          </Typography>
          <Button
            component={RouterLink}
            to="/cards/applications"
            variant="contained"
            sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
          >
            카드 신청하기
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <CreditCardIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>카드관리</Typography>
        </Stack>
        <Button
          component={RouterLink}
          to="/cards/applications"
          variant="outlined"
          startIcon={<AddCardIcon />}
          sx={{ borderColor: '#d32f2f', color: '#d32f2f' }}
        >
          신규 카드 신청
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {cards.map((card: any) => {
          const cardName = card.cardAlias || card.cardType || 'MyCard';
          const statusInfo = getStatusInfo(card.status || 'ACTIVE');
          return (
            <Grid item xs={12} sm={6} lg={4} key={card.id}>
              <Card sx={{ p: 3, transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' } }}>
                {/* 카드 이미지 */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, position: 'relative' }}>
                  <CreditCardVisual
                    cardName={cardName}
                    cardNumber={card.cardNumberMasked}
                    size="medium"
                  />
                  <Box sx={{ position: 'absolute', top: -8, right: -8 }}>
                    <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
                  </Box>
                </Box>

                {/* 카드 정보 */}
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, textAlign: 'center' }}>
                  {cardName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                  {card.cardNumberMasked || '****-****-****-****'}
                </Typography>

                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">한도</Typography>
                    <Typography sx={{ fontWeight: 600 }}>
                      {(card.creditLimit || 0).toLocaleString()}만원
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">사용 가능</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#d32f2f' }}>
                      {(card.availableLimit || 0).toLocaleString()}만원
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 2, borderTop: '1px solid #eee' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={card.overseasPaymentEnabled || false}
                        onChange={async (_, checked) => {
                          await cardsApi.toggleOverseas(card.id, checked).catch(() => null);
                          show('해외결제 설정이 변경되었습니다.', 'success');
                          queryClient.invalidateQueries({ queryKey: ['cards'] });
                        }}
                        size="small"
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#d32f2f' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#d32f2f' } }}
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <PublicIcon sx={{ fontSize: 16, color: card.overseasPaymentEnabled ? '#d32f2f' : '#999' }} />
                        <Typography variant="caption">해외결제</Typography>
                      </Stack>
                    }
                  />
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                    onClick={async () => {
                      await cardsApi.requestReissue(card.id).catch(() => null);
                      show('재발급 신청이 접수되었습니다.', 'success');
                      queryClient.invalidateQueries({ queryKey: ['cards'] });
                    }}
                    sx={{ color: '#666', fontSize: '0.75rem' }}
                  >
                    재발급
                  </Button>
                </Stack>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
