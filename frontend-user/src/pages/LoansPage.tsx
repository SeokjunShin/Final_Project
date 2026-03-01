import { Box, Button, Card, CardContent, Chip, Dialog, DialogContent, DialogTitle, FormControl, InputAdornment, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { SecondAuthDialog } from '@/components/common/SecondAuthDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableSection } from '@/components/common/TableSection';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { loansApi } from '@/api';
import type { LoanType } from '@/types';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  CASH_ADVANCE: '현금서비스',
  CARD_LOAN: '카드대출',
};

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: '신청',
  APPROVED: '승인',
  DISBURSED: '출금완료',
  REPAID: '상환완료',
  CANCELED: '취소',
};

const formatDate = (iso: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export const LoansPage = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { show } = useSnackbar();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [amount, setAmount] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('CARD_LOAN');
  const [detailLoanId, setDetailLoanId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['loans', page, pageSize],
    queryFn: () => loansApi.list({ page, size: pageSize }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { loanType: LoanType; principalAmount: number }) =>
      loansApi.create({ ...payload, interestRate: 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      show('대출 신청이 접수되었습니다.', 'success');
      setAmount('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? '대출 신청에 실패했습니다.';
      show(msg, 'error');
    },
  });

  const handleSubmit = () => {
    const num = Number(amount?.replace(/,/g, ''));
    if (!Number.isFinite(num) || num < 1) {
      show('신청 금액을 입력해 주세요.', 'error');
      return;
    }

    setIsAuthModalOpen(true); // 2차 인증 팝업 유도
  };

  const executeLoan = () => {
    const num = Number(amount?.replace(/,/g, ''));
    createMutation.mutate({ loanType, principalAmount: num });
  };

  const rows = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['loan-detail', detailLoanId],
    queryFn: () => loansApi.detail(detailLoanId!),
    enabled: detailLoanId != null && Number.isFinite(detailLoanId),
  });

  return (
    <Box>
      <SecondAuthDialog
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          executeLoan();
        }}
      />
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        금융서비스 - 대출
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>대출 유형</InputLabel>
              <Select
                value={loanType}
                label="대출 유형"
                onChange={(e) => setLoanType(e.target.value as LoanType)}
              >
                <MenuItem value="CARD_LOAN">{LOAN_TYPE_LABELS.CARD_LOAN}</MenuItem>
                <MenuItem value="CASH_ADVANCE">{LOAN_TYPE_LABELS.CASH_ADVANCE}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="신청 금액"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">원</InputAdornment>,
                inputProps: { min: 1 },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              대출 신청
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {rows.length > 0 ? (
        <Card>
          <CardContent>
            <TableSection
              loading={isLoading}
              rows={rows}
              columns={[
                ...(rows.some((r: { userName?: string }) => r.userName != null) ? [{
                  field: 'userName',
                  headerName: '회원',
                  flex: 1,
                  valueGetter: (_: unknown, row: { userName?: string }) => row.userName ?? '-',
                }] : []),
                {
                  field: 'loanType',
                  headerName: '유형',
                  flex: 1,
                  valueGetter: (_: unknown, row: { loanType: LoanType }) => LOAN_TYPE_LABELS[row.loanType] ?? row.loanType,
                },
                {
                  field: 'principalAmount',
                  headerName: '원금',
                  flex: 1,
                  valueFormatter: (v: number) => `${Number(v ?? 0).toLocaleString('ko-KR')}원`,
                },
                {
                  field: 'status',
                  headerName: '상태',
                  flex: 1,
                  valueGetter: (_: unknown, row: { status: string }) => STATUS_LABELS[row.status] ?? row.status,
                },
                {
                  field: 'requestedAt',
                  headerName: '신청일',
                  flex: 1,
                  valueGetter: (_: unknown, row: { requestedAt: string }) => formatDate(row.requestedAt),
                },
              ]}
              rowCount={totalElements}
              paginationMode="server"
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={(m) => {
                setPage(m.page);
                setPageSize(m.pageSize);
              }}
              onRowClick={(row) => setDetailLoanId(Number(row.id))}
            />
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <AccountBalanceIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#666', mb: 1 }}>
              대출 내역이 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary">
              대출을 신청하면 여기에 표시됩니다. 승인 후 상태가 변경됩니다.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Dialog open={detailLoanId != null} onClose={() => setDetailLoanId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>대출 상세</DialogTitle>
        <DialogContent>
          {detailLoading && <Typography color="text.secondary">로딩 중...</Typography>}
          {!detailLoading && detailData && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography variant="subtitle1" color="text.secondary">대출 번호</Typography>
                <Typography fontWeight={600}>#{detailData.id}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography variant="subtitle1" color="text.secondary">유형</Typography>
                <Typography>{LOAN_TYPE_LABELS[detailData.loanType] ?? detailData.loanType}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography variant="subtitle1" color="text.secondary">원금</Typography>
                <Typography fontWeight={600}>{Number(detailData.principalAmount).toLocaleString('ko-KR')}원</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography variant="subtitle1" color="text.secondary">이자율</Typography>
                <Typography>{Number(detailData.interestRate ?? 0).toFixed(2)}%</Typography>
              </Stack>
              {detailData.termMonths != null && (
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <Typography variant="subtitle1" color="text.secondary">대출 기간</Typography>
                  <Typography>{detailData.termMonths}개월</Typography>
                </Stack>
              )}
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography variant="subtitle1" color="text.secondary">상태</Typography>
                <Chip label={STATUS_LABELS[detailData.status] ?? detailData.status} size="small" color="primary" variant="outlined" />
              </Stack>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography variant="subtitle1" color="text.secondary">신청일</Typography>
                <Typography>{formatDate(detailData.requestedAt)}</Typography>
              </Stack>
              {detailData.approvedAt && (
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <Typography variant="subtitle1" color="text.secondary">승인일</Typography>
                  <Typography>{formatDate(detailData.approvedAt)}</Typography>
                </Stack>
              )}
              {detailData.disbursedAt && (
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <Typography variant="subtitle1" color="text.secondary">출금일</Typography>
                  <Typography>{formatDate(detailData.disbursedAt)}</Typography>
                </Stack>
              )}
              {detailData.repaidAt && (
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <Typography variant="subtitle1" color="text.secondary">상환일</Typography>
                  <Typography>{formatDate(detailData.repaidAt)}</Typography>
                </Stack>
              )}
              {detailData.canceledAt && (
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <Typography variant="subtitle1" color="text.secondary">취소일</Typography>
                  <Typography>{formatDate(detailData.canceledAt)}</Typography>
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
