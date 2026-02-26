import { Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';
import { formatDateTime } from '@/utils/dateUtils';

export const DocumentsPage = () => {
  const [status, setStatus] = useState('');
  const { show } = useAdminSnackbar();

  // 반려 사유 다이얼로그
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-documents', status],
    queryFn: async () => {
      return await adminApi.documents({ status });
    },
  });

  const transition = async (id: number, next: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      await adminApi.documentTransition(id, next, reason);
      show(`문서가 ${next === 'APPROVED' ? '승인' : '반려'}되었습니다.`, 'success');
      await refetch();
    } catch (e) {
      console.error('문서 상태 변경 실패:', e);
      show('문서 상태 변경에 실패했습니다.', 'error');
    }
  };

  const handleRejectClick = (id: number) => {
    setRejectTargetId(id);
    setRejectionReason('');
    setRejectOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (rejectTargetId !== null) {
      await transition(rejectTargetId, 'REJECTED', rejectionReason);
    }
    setRejectOpen(false);
    setRejectTargetId(null);
    setRejectionReason('');
  };

  const handleDownload = async (documentId: number, fileName: string) => {
    try {
      await adminApi.documentDownload(documentId, fileName);
    } catch (e) {
      console.error('다운로드 실패:', e);
      show('파일 다운로드에 실패했습니다.', 'error');
    }
  };

  const statusChip = (s: string) => {
    switch (s) {
      case 'SUBMITTED': return <Chip size="small" label="대기중" color="warning" />;
      case 'UNDER_REVIEW': return <Chip size="small" label="검토중" color="info" />;
      case 'APPROVED': return <Chip size="small" label="승인" color="success" />;
      case 'REJECTED': return <Chip size="small" label="반려" color="error" />;
      default: return <Chip size="small" label={s} />;
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
          문서 검토
        </Typography>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          displayEmpty
          size="small"
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">전체</MenuItem>
          <MenuItem value="SUBMITTED">대기중</MenuItem>
          <MenuItem value="APPROVED">승인</MenuItem>
          <MenuItem value="REJECTED">반려</MenuItem>
        </Select>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">문서 데이터를 불러올 수 없습니다.</Typography>
        </Box>
      ) : (!data?.content || data.content.length === 0) ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">문서가 없습니다.</Typography>
        </Box>
      ) : (
        <AdminTable
          rows={data.content}
          columns={[
            {
              field: 'title',
              headerName: '문서명',
              flex: 2,
              renderCell: (params) => {
                const row = params.row;
                if (row.attachmentId) {
                  return (
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#1976d2',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        '&:hover': { color: '#1565c0' },
                      }}
                      onClick={() => handleDownload(row.id, row.title)}
                    >
                      {row.title}
                    </Typography>
                  );
                }
                return <Typography variant="body2">{row.title}</Typography>;
              },
            },
            {
              field: 'docType',
              headerName: '문서 유형',
              flex: 1,
              renderCell: (params) => {
                const types: Record<string, string> = {
                  INCOME_PROOF: '소득증빙',
                  ID_CARD: '신분증',
                  RESIDENCE_PROOF: '주소증빙',
                  EMPLOYMENT_PROOF: '재직증명',
                  OTHER: '기타서류',
                };
                return <Typography variant="body2">{types[params.row.docType] || params.row.docType}</Typography>;
              },
            },
            {
              field: 'status',
              headerName: '상태',
              flex: 1,
              renderCell: (params) => statusChip(params.row.status),
            },
            { field: 'submitterName', headerName: '신청자', flex: 1 },
            { field: 'createdAt', headerName: '제출일', flex: 1, valueFormatter: (v: string) => formatDateTime(v) },
            {
              field: 'action',
              headerName: '상태 전이',
              flex: 2,
              renderCell: (params) => {
                const s = params.row.status;
                if (s === 'APPROVED' || s === 'REJECTED') {
                  return (
                    <Typography variant="caption" color="text.secondary">
                      {s === 'APPROVED' ? '승인 완료' : `반려됨${params.row.rejectionReason ? ': ' + params.row.rejectionReason : ''}`}
                    </Typography>
                  );
                }
                return (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={() => transition(params.row.id, 'APPROVED')}>
                      승인
                    </Button>
                    <Button size="small" color="error" variant="outlined" onClick={() => handleRejectClick(params.row.id)}>
                      반려
                    </Button>
                  </Stack>
                );
              },
            },
          ]}
        />
      )}

      {/* 반려 사유 입력 다이얼로그 */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>반려 사유 입력</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="반려 사유"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>취소</Button>
          <Button variant="contained" color="error" onClick={handleRejectConfirm}>
            반려
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
