import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';
import { SecondAuthDialog } from '@/components/common/SecondAuthDialog';
import type { LoanDetail, LoanListItem, LoanType } from '@/types';

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

const maskCardNumber = (cardNumber: string | null | undefined) => {
  if (!cardNumber) return '****-****-****-****';
  const parts = cardNumber.split('-');
  if (parts.length === 4) {
    return `${parts[0]}-${parts[1]}-****-****`;
  }
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length >= 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-****-****`;
  }
  return '****-****-****-****';
};

export const LoansPage = () => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [detailLoanId, setDetailLoanId] = useState<number | null>(null);
  
  // 2차 인증 액션 구분을 위한 state
  const [secondAuthOpen, setSecondAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | { type: 'approve' | 'disburse'; id: number }>(null);
  
  const queryClient = useQueryClient();
  const { show } = useAdminSnackbar();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-loans', page, pageSize],
    queryFn: () => adminApi.loans({ page, size: pageSize }),
  });

  const rows = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-loan-detail', detailLoanId],
    queryFn: () => adminApi.loanDetail(detailLoanId!),
    enabled: detailLoanId != null && Number.isFinite(detailLoanId),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, pass }: { id: number; pass: string }) => adminApi.approveLoan(id, pass),
    onSuccess: async (data: LoanDetail) => {
      show('대출이 승인되었습니다.', 'success');
      queryClient.setQueryData(['admin-loan-detail', data.id], data);
      // 목록 캐시에 승인 결과 반영(테이블이 즉시 갱신되도록)
      queryClient.setQueryData(
        ['admin-loans', page, pageSize],
        (old: { content?: LoanListItem[]; totalElements?: number } | undefined) => {
          if (!old?.content) return old;
          return {
            ...old,
            content: old.content.map((row) =>
              row.id === data.id ? { ...row, status: data.status } : row,
            ),
          };
        },
      );
      await queryClient.invalidateQueries({ queryKey: ['admin-loans'] });
    },
    onError: (e: unknown) => {
      const err = e as { response?: { status?: number; data?: { message?: string } } };
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 403) {
        show('권한이 없습니다. 관리자 또는 운영자 계정으로 로그인해 주세요.', 'error');
      } else {
        show(msg ?? '대출 승인에 실패했습니다.', 'error');
      }
    },
  });

  const disburseMutation = useMutation({
    mutationFn: ({ id, pass }: { id: number; pass: string }) => adminApi.disburseLoan(id, pass),
    onSuccess: async (data: LoanDetail) => {
      show('출금 완료 처리되었습니다.', 'success');
      queryClient.setQueryData(['admin-loan-detail', data.id], data);
      queryClient.setQueryData(
        ['admin-loans', page, pageSize],
        (old: { content?: LoanListItem[]; totalElements?: number } | undefined) => {
          if (!old?.content) return old;
          return {
            ...old,
            content: old.content.map((row) =>
              row.id === data.id ? { ...row, status: data.status } : row,
            ),
          };
        },
      );
      await queryClient.invalidateQueries({ queryKey: ['admin-loans'] });
    },
    onError: (e: unknown) => {
      const err = e as { response?: { status?: number; data?: { message?: string } } };
      const msg = err.response?.data?.message;
      show(err.response?.status === 403 ? '권한이 없습니다.' : (msg ?? '출금 처리에 실패했습니다.'), 'error');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => adminApi.cancelLoan(id),
    onSuccess: async (data: LoanDetail) => {
      show('대출이 취소되었습니다.', 'success');
      queryClient.setQueryData(['admin-loan-detail', data.id], data);
      queryClient.setQueryData(
        ['admin-loans', page, pageSize],
        (old: { content?: LoanListItem[]; totalElements?: number } | undefined) => {
          if (!old?.content) return old;
          return {
            ...old,
            content: old.content.map((row) =>
              row.id === data.id ? { ...row, status: data.status } : row,
            ),
          };
        },
      );
      await queryClient.invalidateQueries({ queryKey: ['admin-loans'] });
    },
    onError: (e: unknown) => {
      const err = e as { response?: { status?: number; data?: { message?: string } } };
      const msg = err.response?.data?.message;
      show(err.response?.status === 403 ? '권한이 없습니다.' : (msg ?? '대출 취소에 실패했습니다.'), 'error');
    },
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        대출 현황
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        회원들이 신청한 대출 전체 목록입니다.
      </Typography>

      <Card>
        <CardContent>
          <AdminTable
            loading={isLoading}
            rows={rows}
            getRowId={(row: LoanListItem) => row.id}
            columns={[
              { field: 'userName', headerName: '회원', flex: 1, valueGetter: (_: unknown, row: LoanListItem) => row.userName ?? '-' },
              { field: 'loanType', headerName: '유형', flex: 1, valueGetter: (_: unknown, row: LoanListItem) => LOAN_TYPE_LABELS[row.loanType] ?? row.loanType },
              {
                field: 'cardAlias',
                headerName: '연결 카드',
                flex: 1.2,
                renderCell: (params: { row: LoanListItem }) => params.row.cardAlias ? `${params.row.cardAlias} / ${maskCardNumber(params.row.cardNumberMasked)}` : '-',
              },
              {
                field: 'depositBankName',
                headerName: '입금 계좌',
                flex: 1.2,
                valueGetter: (_: unknown, row: LoanListItem) => row.depositBankName ? `${row.depositBankName} / ${row.depositAccountNumberMasked}` : '-',
              },
              { field: 'principalAmount', headerName: '원금', flex: 1, valueGetter: (_: unknown, row: LoanListItem) => `${Number(row.principalAmount ?? 0).toLocaleString('ko-KR')}원` },
              { field: 'status', headerName: '상태', flex: 1, valueGetter: (_: unknown, row: LoanListItem) => STATUS_LABELS[row.status] ?? row.status },
              { field: 'requestedAt', headerName: '신청일', flex: 1, valueGetter: (_: unknown, row: LoanListItem) => formatDate(row.requestedAt) },
              {
                field: 'detail',
                headerName: '승인',
                width: 90,
                sortable: false,
                filterable: false,
                renderCell: (params: { row: LoanListItem }) => (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailLoanId(params.row.id);
                    }}
                  >
                    {'>'}
                  </Button>
                ),
              },
            ]}
            rowCount={totalElements}
            paginationMode="server"
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={(m: { page: number; pageSize: number }) => {
              setPage(m.page);
              setPageSize(m.pageSize ?? 10);
            }}
            onRowClick={(params: { id: number | string }) => setDetailLoanId(Number(params.id))}
          />
        </CardContent>
      </Card>

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
                <Typography variant="subtitle1" color="text.secondary">연결 카드</Typography>
                <Typography>{detailData.cardAlias ? `${detailData.cardAlias} / ${maskCardNumber(detailData.cardNumberMasked)}` : '-'}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography variant="subtitle1" color="text.secondary">입금 계좌</Typography>
                <Typography>{detailData.depositBankName ? `${detailData.depositBankName} / ${detailData.depositAccountNumberMasked}` : '-'}</Typography>
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
              {/* 관리자 조정 버튼 */}
              <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
                {detailData.status === 'REQUESTED' && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      disabled={approveMutation.isPending || cancelMutation.isPending}
                      onClick={() => {
                        setPendingAction({ type: 'approve', id: detailData.id });
                        setSecondAuthOpen(true);
                      }}
                    >
                      승인
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      disabled={approveMutation.isPending || cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(detailData.id)}
                    >
                      거절
                    </Button>
                  </>
                )}
                {detailData.status === 'APPROVED' && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      disabled={disburseMutation.isPending || cancelMutation.isPending}
                      onClick={() => {
                        setPendingAction({ type: 'disburse', id: detailData.id });
                        setSecondAuthOpen(true);
                      }}
                    >
                      출금완료
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      disabled={disburseMutation.isPending || cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(detailData.id)}
                    >
                      취소
                    </Button>
                  </>
                )}
              </Stack>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
      
      {/* 2차 비밀번호 모달 (가상 키패드) */}
      <SecondAuthDialog
        open={secondAuthOpen}
        onClose={() => { setSecondAuthOpen(false); setPendingAction(null); }}
        onComplete={(pin) => {
          setSecondAuthOpen(false);
          if (pendingAction?.type === 'approve') {
            approveMutation.mutate({ id: pendingAction.id, pass: pin });
          } else if (pendingAction?.type === 'disburse') {
            disburseMutation.mutate({ id: pendingAction.id, pass: pin });
          }
          setPendingAction(null);
        }}
      />
    </Box>
  );
};
