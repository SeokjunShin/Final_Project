import { useState, useEffect } from 'react';
import { Box, Button, Card, CardContent, FormControlLabel, Grid, Stack, Switch, Typography, Chip, IconButton, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cardsApi, authApi } from '@/api';
import { useSnackbar } from '@/contexts/SnackbarContext';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PublicIcon from '@mui/icons-material/Public';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddCardIcon from '@mui/icons-material/AddCard';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link as RouterLink } from 'react-router-dom';
import { CreditCard as CreditCardVisual } from '@/components/common/CreditCard';
import { SecureKeypad } from '@/components/common/SecureKeypad';

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

  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [reissueCardId, setReissueCardId] = useState<number | null>(null);
  const [secondPwd, setSecondPwd] = useState('');
  const [secondAuthError, setSecondAuthError] = useState('');

  useEffect(() => {
    if (secondPwd.length === 6 && reissueCardId !== null) {
      authApi.verifySecondPassword(secondPwd)
        .then(() => cardsApi.requestReissue(reissueCardId))
        .then(() => {
          show('재발급 신청이 접수되었습니다. 관리자 확인 후 처리됩니다.', 'success');
          queryClient.invalidateQueries({ queryKey: ['cards'] });
          setReissueCardId(null);
          setSecondPwd('');
          setSecondAuthError('');
        })
        .catch((err) => {
          if (err.response?.status === 401) {
            setSecondAuthError(err.response?.data?.message || '비밀번호가 일치하지 않습니다.');
            setSecondPwd('');
          } else {
            const data = err?.response?.data;
            const msg = (typeof data?.message === 'string' ? data.message : null) ?? '재발급 신청에 실패했습니다.';
            show(String(msg), 'error');
            setReissueCardId(null);
            setSecondPwd('');
            setSecondAuthError('');
          }
        });
    }
  }, [secondPwd, reissueCardId, queryClient, show]);

  const toggleVisibility = (id: number) => {
    setVisibleCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { data, isError, refetch, isLoading } = useQuery({
    queryKey: ['cards'],
    queryFn: () => cardsApi.list(),
  });

  const cards = data ?? [];

  if (isError) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <CreditCardIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>카드관리</Typography>
        </Stack>
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ mb: 1, color: '#666' }}>카드 목록을 불러오지 못했습니다</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            로그인 상태를 확인하거나 잠시 후 다시 시도해 주세요.
          </Typography>
          <Button variant="contained" onClick={() => refetch()} sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
            다시 불러오기
          </Button>
        </Card>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <CreditCardIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>카드관리</Typography>
        </Stack>
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">카드 목록을 불러오는 중...</Typography>
        </Card>
      </Box>
    );
  }

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
                    cardNumber={card.cardNumber}
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
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {visibleCards.has(card.id)
                      ? (card.cardNumber || '****-****-****-****')
                      : (card.cardNumber ? `${card.cardNumber.substring(0, 9)}****-****` : '****-****-****-****')}
                  </Typography>
                  <IconButton size="small" onClick={() => toggleVisibility(card.id)} sx={{ color: '#999' }}>
                    {visibleCards.has(card.id) ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </Stack>

                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">한도</Typography>
                    <Typography sx={{ fontWeight: 600 }}>
                      {Math.floor((card.creditLimit || 0) / 10000).toLocaleString()}만원
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">사용 가능</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#d32f2f' }}>
                      {Math.floor((card.availableLimit || 0) / 10000).toLocaleString()}만원
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 2, borderTop: '1px solid #eee' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={card.overseasPaymentEnabled || false}
                        onChange={async () => {
                          await cardsApi.toggleOverseas(card.id).catch(() => null);
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
                    onClick={() => setReissueCardId(card.id)}
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

      {/* 재발급 2차 비밀번호 인증 팝업 */}
      <Dialog
        open={reissueCardId !== null}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        onClose={() => { setReissueCardId(null); setSecondPwd(''); setSecondAuthError(''); }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(4px)',
            }
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 800, color: '#333', pt: 3, pb: 1 }}>
          재발급 승인 인증
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 4, overflow: 'hidden' }}>
          <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.6, textAlign: 'center', mb: 3 }}>
            카드를 새로 발급받기 위해<br />
            2차 비밀번호(6자리)를 입력해 주세요.
          </Typography>
          <Box sx={{ width: '100%', maxWidth: 300 }}>
            <SecureKeypad
              value={secondPwd}
              onChange={(v) => { setSecondPwd(v); setSecondAuthError(''); }}
            />
            {secondAuthError && (
              <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 2, fontWeight: 600 }}>
                {secondAuthError}
              </Typography>
            )}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => { setReissueCardId(null); setSecondPwd(''); setSecondAuthError(''); }}
                sx={{ borderRadius: 2, px: 3, color: '#666', borderColor: '#ccc' }}
              >
                취소
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};
