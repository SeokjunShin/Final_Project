import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box, Button, Card, CardContent, Chip, Grid, Stack, TextField, Typography,
  LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, IconButton, Tooltip, Alert
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import { pointsApi, bankAccountApi, type BankAccount } from '@/api';
import { SecondAuthDialog } from '@/components/common/SecondAuthDialog';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTime } from '@/utils/dateUtils';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';

// 포인트 전환 스키마
const convertSchema = z.object({
  points: z.coerce.number().min(1000, '최소 1,000P부터 전환 가능합니다.').max(50000, '1회 최대 50,000P까지 전환 가능합니다.'),
  accountId: z.coerce.number().optional(),
});

// 계좌 등록 스키마
const accountSchema = z.object({
  bankCode: z.string().min(1, '은행을 선택하세요.'),
  accountNumber: z.string().regex(/^[0-9-]{10,20}$/, '유효한 계좌번호를 입력하세요.'),
  accountHolder: z.string().min(1, '예금주명을 입력하세요.'),
  setAsDefault: z.boolean().optional(),
});

type ConvertFormValues = z.infer<typeof convertSchema>;
type AccountFormValues = z.infer<typeof accountSchema>;

const getTypeInfo = (type: string) => {
  switch (type) {
    case 'EARN': return { label: '적립', color: '#4caf50', icon: <TrendingUpIcon sx={{ fontSize: 18 }} /> };
    case 'SPEND': return { label: '사용', color: '#f44336', icon: <TrendingDownIcon sx={{ fontSize: 18 }} /> };
    case 'CONVERT': return { label: '전환', color: '#ff9800', icon: <SwapHorizIcon sx={{ fontSize: 18 }} /> };
    case 'ADJUST': return { label: '조정', color: '#2196f3', icon: <CardGiftcardIcon sx={{ fontSize: 18 }} /> };
    default: return { label: type, color: '#666', icon: <CardGiftcardIcon sx={{ fontSize: 18 }} /> };
  }
};

export const PointsPage = () => {
  const { show } = useSnackbar();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  const [secondAuthOpen, setSecondAuthOpen] = useState(false);
  const [pendingConvertData, setPendingConvertData] = useState<{ points: number, accountId: number } | null>(null);

  // 포인트 잔액 조회
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['points-balance'],
    queryFn: () => pointsApi.balance().catch(() => ({ totalPoints: 0, availablePoints: 0, expiringPoints: 0, expiringDate: null })),
  });

  // 포인트 내역 조회
  const { data: ledger, isLoading: ledgerLoading } = useQuery({
    queryKey: ['points-ledger'],
    queryFn: () => pointsApi.ledger({ page: 0, size: 20 }).catch(() => ({ content: [], totalElements: 0 })),
  });

  // 계좌 목록 조회
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => bankAccountApi.list().catch(() => []),
  });

  // 은행 코드 목록 조회
  const { data: bankCodes = [] } = useQuery({
    queryKey: ['bank-codes'],
    queryFn: () => bankAccountApi.getBankCodes().catch(() => []),
  });

  // 포인트 전환 폼
  const convertForm = useForm<ConvertFormValues>({
    resolver: zodResolver(convertSchema),
    defaultValues: { points: 1000 },
  });

  // 계좌 등록 폼
  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { accountHolder: user?.name || '' },
  });

  // 포인트 전환 Mutation
  const convertMutation = useMutation({
    mutationFn: (data: ConvertFormValues) => pointsApi.convert(data.points, data.accountId),
    onSuccess: () => {
      show('포인트 전환 요청이 접수되었습니다.', 'success');
      convertForm.reset();
      queryClient.invalidateQueries({ queryKey: ['points-balance'] });
      queryClient.invalidateQueries({ queryKey: ['points-ledger'] });
    },
    onError: (error: any) => {
      show(error?.response?.data?.message || '포인트 전환에 실패했습니다.', 'error');
    },
  });

  // 계좌 등록 Mutation
  const addAccountMutation = useMutation({
    mutationFn: bankAccountApi.add,
    onSuccess: () => {
      show('계좌가 등록되었습니다.', 'success');
      setAccountDialogOpen(false);
      accountForm.reset({ accountHolder: user?.name || '' });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
    onError: (error: any) => {
      show(error?.response?.data?.message || '계좌 등록에 실패했습니다.', 'error');
    },
  });

  // 계좌 삭제 Mutation
  const deleteAccountMutation = useMutation({
    mutationFn: bankAccountApi.delete,
    onSuccess: () => {
      show('계좌가 삭제되었습니다.', 'success');
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
    onError: (error: any) => {
      show(error?.response?.data?.message || '계좌 삭제에 실패했습니다.', 'error');
    },
  });

  // 기본 계좌 설정 Mutation
  const setDefaultMutation = useMutation({
    mutationFn: bankAccountApi.setDefault,
    onSuccess: () => {
      show('기본 계좌가 변경되었습니다.', 'success');
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });

  const onConvert = (data: ConvertFormValues) => {
    const account = selectedAccountId
      ? accounts.find((a: BankAccount) => a.id === selectedAccountId)
      : accounts.find((a: BankAccount) => a.isDefault);

    if (!account) {
      show('출금 계좌를 선택하세요.', 'error');
      return;
    }

    if ((balance?.availablePoints ?? 0) < data.points) {
      show('포인트 잔액이 부족합니다.', 'error');
      return;
    }

    setPendingConvertData({ points: data.points, accountId: account.id });
    setSecondAuthOpen(true);
  };

  const pointBalance = balance?.availablePoints ?? 0;
  const transactions = ledger?.content ?? [];
  const defaultAccount = accounts.find((a: BankAccount) => a.isDefault);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <CardGiftcardIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>포인트</Typography>
      </Stack>

      <Grid container spacing={3}>
        {/* 왼쪽: 포인트 잔액 + 전환 */}
        <Grid item xs={12} md={5}>
          {/* 포인트 잔액 카드 */}
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
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <SwapHorizIcon sx={{ color: '#ff9800' }} />
                <Typography sx={{ fontWeight: 700 }}>포인트 현금 전환</Typography>
              </Stack>

              {accounts.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  포인트를 현금으로 전환하려면 먼저 출금 계좌를 등록해주세요.
                </Alert>
              ) : (
                <Stack component="form" onSubmit={convertForm.handleSubmit(onConvert)} spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>출금 계좌</InputLabel>
                    <Select
                      value={selectedAccountId ?? (defaultAccount?.id ?? '')}
                      onChange={(e) => setSelectedAccountId(e.target.value as number)}
                      label="출금 계좌"
                    >
                      {accounts.map((account: BankAccount) => (
                        <MenuItem key={account.id} value={account.id}>
                          {account.bankName} {account.accountNumberMasked}
                          {account.isDefault && ' (기본)'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="전환할 포인트"
                    placeholder="1000"
                    {...convertForm.register('points')}
                    error={!!convertForm.formState.errors.points}
                    helperText={convertForm.formState.errors.points?.message || `보유: ${pointBalance.toLocaleString()}P (수수료 없음)`}
                    fullWidth
                    InputProps={{
                      endAdornment: <Typography color="text.secondary">P</Typography>,
                    }}
                  />

                  <Button
                    variant="contained"
                    type="submit"
                    fullWidth
                    disabled={pointBalance < 1000 || convertMutation.isPending}
                    sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
                  >
                    {convertMutation.isPending ? '처리 중...' : '현금으로 전환'}
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* 출금 계좌 관리 */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AccountBalanceIcon sx={{ color: '#1976d2' }} />
                  <Typography sx={{ fontWeight: 700 }}>출금 계좌 관리</Typography>
                </Stack>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setAccountDialogOpen(true)}
                  disabled={accounts.length >= 5}
                >
                  계좌 추가
                </Button>
              </Stack>

              {accountsLoading ? (
                <LinearProgress />
              ) : accounts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: '#999' }}>
                  <AccountBalanceIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography>등록된 계좌가 없습니다</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    본인 명의 계좌만 등록 가능합니다
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {accounts.map((account: BankAccount) => (
                    <Box
                      key={account.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        bgcolor: account.isDefault ? '#e3f2fd' : '#fafafa',
                        borderRadius: 2,
                        border: account.isDefault ? '1px solid #90caf9' : '1px solid #f0f0f0',
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            width: 36, height: 36, borderRadius: '50%',
                            bgcolor: '#1976d215', color: '#1976d2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <AccountBalanceIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                              {account.bankName}
                            </Typography>
                            {account.isDefault && (
                              <Chip
                                icon={<StarIcon sx={{ fontSize: 12 }} />}
                                label="기본"
                                size="small"
                                sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#1976d2', color: '#fff' }}
                              />
                            )}
                            {account.isVerified && (
                              <Tooltip title="인증완료">
                                <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                              </Tooltip>
                            )}
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {account.accountNumberMasked} · {account.accountHolder}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={0.5}>
                        {!account.isDefault && (
                          <Tooltip title="기본 계좌로 설정">
                            <IconButton
                              size="small"
                              onClick={() => setDefaultMutation.mutate(account.id)}
                            >
                              <StarIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="삭제">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (confirm('계좌를 삭제하시겠습니까?')) {
                                deleteAccountMutation.mutate(account.id);
                              }
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  ))}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    * 최대 5개 계좌 등록 가능 ({accounts.length}/5)
                  </Typography>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 오른쪽: 포인트 내역 */}
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
                    const typeInfo = getTypeInfo(item.transactionType || item.type || item.entryType);
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
                              width: 36, height: 36, borderRadius: '50%',
                              bgcolor: `${typeInfo.color}15`, color: typeInfo.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                                  height: 20, fontSize: '0.65rem',
                                  bgcolor: `${typeInfo.color}15`, color: typeInfo.color,
                                  fontWeight: 600,
                                }}
                              />
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(item.createdAt)}
                            </Typography>
                          </Box>
                        </Stack>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: item.amount > 0 ? '#4caf50' : '#f44336',
                          }}
                        >
                          {item.amount > 0 ? '+' : ''}{item.amount?.toLocaleString()}P
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

      {/* 계좌 등록 다이얼로그 */}
      <Dialog open={accountDialogOpen} onClose={() => setAccountDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>출금 계좌 등록</DialogTitle>
        <form onSubmit={accountForm.handleSubmit((data) => addAccountMutation.mutate(data))}>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              본인 명의 계좌만 등록 가능합니다. 예금주명은 회원 이름과 일치해야 합니다.
            </Alert>

            <Stack spacing={2.5}>
              <Controller
                name="bankCode"
                control={accountForm.control}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel>은행 선택</InputLabel>
                    <Select {...field} label="은행 선택">
                      {bankCodes.map((bank) => (
                        <MenuItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {fieldState.error && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {fieldState.error.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              <TextField
                label="계좌번호"
                placeholder="숫자만 입력 (예: 1234567890123)"
                {...accountForm.register('accountNumber')}
                error={!!accountForm.formState.errors.accountNumber}
                helperText={accountForm.formState.errors.accountNumber?.message}
                fullWidth
              />

              <TextField
                label="예금주명"
                {...accountForm.register('accountHolder')}
                error={!!accountForm.formState.errors.accountHolder}
                helperText={accountForm.formState.errors.accountHolder?.message || `회원명: ${user?.name}`}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setAccountDialogOpen(false)}>취소</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={addAccountMutation.isPending}
              sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
            >
              {addAccountMutation.isPending ? '등록 중...' : '등록'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <SecondAuthDialog
        open={secondAuthOpen}
        onClose={() => { setSecondAuthOpen(false); setPendingConvertData(null); }}
        onSuccess={() => {
          setSecondAuthOpen(false);
          if (pendingConvertData) {
            convertMutation.mutate(pendingConvertData);
            setPendingConvertData(null);
          }
        }}
      />
    </Box>
  );
};
