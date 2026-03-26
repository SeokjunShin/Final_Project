import { Box, Button, Chip, CircularProgress, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';
import { formatDateTime } from '@/utils/dateUtils';
import { SecondAuthDialog } from '@/components/common/SecondAuthDialog';

const INACTIVE_DAYS = 90;

interface User {
  id: number;
  name: string;
  email: string;
  status: string;
  lastLoginAt?: string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return { label: '활성', color: 'success' as const };
    case 'LOCKED':
      return { label: '잠금', color: 'error' as const };
    case 'INACTIVE':
      return { label: '비활성', color: 'default' as const };
    default:
      return { label: status, color: 'default' as const };
  }
};

export const UsersPage = () => {
  const queryClient = useQueryClient();
  const { show } = useAdminSnackbar();

  const [pointModalOpen, setPointModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [grantPoints, setGrantPoints] = useState<number | ''>('');
  const [grantReason, setGrantReason] = useState('');
  const [revokePoints, setRevokePoints] = useState<number | ''>('');
  const [revokeReason, setRevokeReason] = useState('');
  
  const [secondAuthOpen, setSecondAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'grant'|'revoke'|null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.users(),
  });

  const updateState = async (id: number, state: string) => {
    try {
      await adminApi.updateUserState(id, state);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      show(state === 'ACTIVE' ? '상태가 변경되었습니다.' : (state === 'LOCKED' ? '잠금 처리되었습니다.' : '비활성 처리되었습니다.'), 'success');
    } catch {
      show('상태 변경에 실패했습니다.', 'error');
    }
  };

  const bulkInactiveMutation = useMutation({
    mutationFn: () => adminApi.bulkInactiveByLastLogin(INACTIVE_DAYS),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      show(res?.message ?? `${INACTIVE_DAYS}일 미접속 계정 ${res?.count ?? 0}건 비활성 처리되었습니다.`, 'success');
    },
    onError: () => show('일괄 비활성 처리에 실패했습니다.', 'error'),
  });

  const grantPointsMutation = useMutation({
    mutationFn: (payload: { userId: number; points: number; reason: string; pass: string }) =>
      adminApi.grantPoints(payload.userId, { points: payload.points, reason: payload.reason }, payload.pass),
    onSuccess: () => {
      show('포인트 지급이 완료되었습니다.', 'success');
      setPointModalOpen(false);
      setGrantPoints('');
      setGrantReason('');
    },
    onError: (err: any) => {
      show(err.response?.data?.message || '포인트 지급에 실패했습니다.', 'error');
    },
  });

  const revokePointsMutation = useMutation({
    mutationFn: (payload: { userId: number; points: number; reason: string; pass: string }) =>
      adminApi.revokePoints(payload.userId, { points: payload.points, reason: payload.reason }, payload.pass),
    onSuccess: () => {
      show('포인트 차감이 완료되었습니다.', 'success');
      setRevokeModalOpen(false);
      setRevokePoints('');
      setRevokeReason('');
    },
    onError: (err: any) => {
      show(err.response?.data?.message || '포인트 차감에 실패했습니다.', 'error');
    },
  });

  const handleOpenPointModal = (userId: number) => {
    setSelectedUserId(userId);
    setGrantPoints('');
    setGrantReason('');
    setPointModalOpen(true);
  };

  const handleOpenRevokeModal = (userId: number) => {
    setSelectedUserId(userId);
    setRevokePoints('');
    setRevokeReason('');
    setRevokeModalOpen(true);
  };

  const attemptGrantPoints = () => {
    if (!selectedUserId || !grantPoints || !grantReason.trim()) {
      show('요청 정보를 모두 입력해주세요.', 'error');
      return;
    }
    setPendingAction('grant');
    setSecondAuthOpen(true);
  };

  const attemptRevokePoints = () => {
    if (!selectedUserId || !revokePoints || !revokeReason.trim()) {
      show('요청 정보를 모두 입력해주세요.', 'error');
      return;
    }
    setPendingAction('revoke');
    setSecondAuthOpen(true);
  };

  const executeActionWithPin = (pin: string) => {
    if (pendingAction === 'grant' && selectedUserId && grantPoints) {
      grantPointsMutation.mutate({
        userId: selectedUserId,
        points: Number(grantPoints),
        reason: grantReason.trim(),
        pass: pin,
      });
    } else if (pendingAction === 'revoke' && selectedUserId && revokePoints) {
      revokePointsMutation.mutate({
        userId: selectedUserId,
        points: Number(revokePoints),
        reason: revokeReason.trim(),
        pass: pin,
      });
    }
    setPendingAction(null);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">사용자 데이터를 불러올 수 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            사용자 관리
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            잠금: 비정상 계정 접근 제한 · 비활성: 장기 미접속 계정. 마지막 로그인 기준 {INACTIVE_DAYS}일 미접속 시 일괄 비활성 가능.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="warning"
          disabled={bulkInactiveMutation.isPending}
          onClick={() => bulkInactiveMutation.mutate()}
        >
          {INACTIVE_DAYS}일 미접속 비활성 처리
        </Button>
      </Stack>
      {(!data || data.length === 0) ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">등록된 사용자가 없습니다.</Typography>
        </Box>
      ) : (
        <AdminTable
          rows={data}
          getRowId={(row: { id: number }) => row.id}
          columns={[
            { field: 'name', headerName: '이름', flex: 1 },
            { field: 'email', headerName: '이메일', flex: 2 },
            {
              field: 'status',
              headerName: '상태',
              flex: 1,
              renderCell: (params: { row: User }) => {
                const info = getStatusInfo(params.row.status);
                return <Chip label={info.label} color={info.color} size="small" />;
              },
            },
            {
              field: 'lastLoginAt',
              headerName: '마지막 로그인',
              flex: 1.5,
              renderCell: (params: { row: User }) => (
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(params.row.lastLoginAt)}
                </Typography>
              ),
            },
            {
              field: 'action',
              headerName: '상태 변경',
              flex: 2,
              renderCell: (params: { row: User }) => (
                <Stack direction="row" spacing={1}>
                  {params.row.status === 'LOCKED' ? (
                    <Button size="small" color="success" onClick={() => updateState(params.row.id, 'ACTIVE')}>
                      잠금해제
                    </Button>
                  ) : (
                    <Button size="small" color="error" onClick={() => updateState(params.row.id, 'LOCKED')}>
                      잠금
                    </Button>
                  )}
                  {params.row.status === 'INACTIVE' ? (
                    <Button size="small" color="success" onClick={() => updateState(params.row.id, 'ACTIVE')}>
                      활성화
                    </Button>
                  ) : (
                    <Button size="small" color="warning" onClick={() => updateState(params.row.id, 'INACTIVE')}>
                      비활성
                    </Button>
                  )}
                  <Button size="small" color="info" onClick={() => handleOpenPointModal(params.row.id)}>
                    포인트 지급
                  </Button>
                  <Button size="small" color="error" onClick={() => handleOpenRevokeModal(params.row.id)}>
                    포인트 차감
                  </Button>
                </Stack>
              ),
            },
          ]}
        />
      )}

      {/* 포인트 지급 모달 */}
      <Dialog open={pointModalOpen} onClose={() => setPointModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>포인트 수동 지급</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="지급할 포인트 금액"
              type="number"
              fullWidth
              value={grantPoints}
              onChange={(e) => setGrantPoints(e.target.value ? Number(e.target.value) : '')}
              placeholder="예: 1000"
            />
            <TextField
              label="지급 사유"
              fullWidth
              value={grantReason}
              onChange={(e) => setGrantReason(e.target.value)}
              placeholder="예: CS 팀 보상 지급, 시스템 오류 보상 등"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPointModalOpen(false)} color="inherit">취소</Button>
          <Button
            onClick={attemptGrantPoints}
            variant="contained"
            color="primary"
            disabled={grantPointsMutation.isPending}
          >
            {grantPointsMutation.isPending ? <CircularProgress size={24} color="inherit" /> : '포인트 지급'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 포인트 차감 모달 */}
      <Dialog open={revokeModalOpen} onClose={() => setRevokeModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>포인트 수동 차감</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="차감할 포인트 금액"
              type="number"
              fullWidth
              value={revokePoints}
              onChange={(e) => setRevokePoints(e.target.value ? Number(e.target.value) : '')}
              placeholder="예: 500"
            />
            <TextField
              label="차감 사유"
              fullWidth
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="예: 어뷰징 적발, 시스템 오류 회수 등"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeModalOpen(false)} color="inherit">취소</Button>
          <Button
            onClick={attemptRevokePoints}
            variant="contained"
            color="error"
            disabled={revokePointsMutation.isPending}
          >
            {revokePointsMutation.isPending ? <CircularProgress size={24} color="inherit" /> : '포인트 차감'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 2차 비밀번호 모달 (가상 키패드) */}
      <SecondAuthDialog
        open={secondAuthOpen}
        onClose={() => { setSecondAuthOpen(false); setPendingAction(null); }}
        onComplete={(pin) => {
          setSecondAuthOpen(false);
          executeActionWithPin(pin);
        }}
      />
    </Box>
  );
};
