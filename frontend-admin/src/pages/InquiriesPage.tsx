import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import RateReviewIcon from '@mui/icons-material/RateReview';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const schema = z.object({
  answer: z.string().min(5, '답변을 5자 이상 입력하세요.'),
});

type FormValues = z.infer<typeof schema>;

export const InquiriesPage = () => {
  const [queue, setQueue] = useState('unassigned');
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignInquiryId, setAssignInquiryId] = useState<number | null>(null);
  const [selectedOperatorId, setSelectedOperatorId] = useState<number | ''>('');
  const { show } = useAdminSnackbar();
  const queryClient = useQueryClient();
  const { user } = useAdminAuth();
  const isAdmin = user?.role === 'ADMIN';

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-inquiries', queue],
    queryFn: async () => {
      return await adminApi.inquiries({ queue, page: 0, size: 30 });
    },
  });

  // 상담원 목록 조회 (관리자만)
  const operatorsQuery = useQuery({
    queryKey: ['admin-operators'],
    enabled: isAdmin,
    queryFn: () => adminApi.getOperators(),
  });

  const detailQuery = useQuery({
    queryKey: ['admin-inquiry-detail', selectedId],
    enabled: !!selectedId && detailOpen,
    queryFn: () => adminApi.inquiryDetail(Number(selectedId!)),
    retry: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const submitAnswer = async (form: FormValues) => {
    if (!selectedId) return;
    await adminApi.inquiryAnswer(selectedId, form.answer).catch(() => null);
    show('답변이 등록되었습니다.', 'success');
    reset();
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] });
  };

  const renderStatus = (status: string) => {
    if (status === 'ASSIGNED') return <Chip size="small" color="warning" label="배정됨" />;
    if (status === 'ANSWERED') return <Chip size="small" color="primary" label="답변완료" />;
    if (status === 'RESOLVED' || status === 'CLOSED') return <Chip size="small" color="success" label="완료" />;
    if (status === 'IN_PROGRESS') return <Chip size="small" color="info" label="진행중" />;
    return <Chip size="small" label="미배정" />;
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
        <Typography color="text.secondary">문의 데이터를 불러올 수 없습니다.</Typography>
      </Box>
    );
  }

  const summary = data?.content ?? [];
  const unassigned = summary.filter((x: any) => x.status === 'OPEN').length;
  const assigned = summary.filter((x: any) => x.status === 'ASSIGNED').length;

  const detail = detailQuery.data as any;

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">문의 큐</Typography>
        <TextField
          select
          label="큐"
          value={queue}
          onChange={(e) => setQueue(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="unassigned">미배정</MenuItem>
          <MenuItem value="assigned">배정됨</MenuItem>
          <MenuItem value="all">전체 (완료 포함)</MenuItem>
        </TextField>
      </Stack>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center">
              <PersonAddAltIcon color="primary" />
              <Typography variant="body2" color="text.secondary">미배정 문의</Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{unassigned}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center">
              <RateReviewIcon color="warning" />
              <Typography variant="body2" color="text.secondary">처리중 문의</Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{assigned}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center">
              <AssignmentTurnedInIcon color="success" />
              <Typography variant="body2" color="text.secondary">오늘 처리 목표</Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>20</Typography>
          </CardContent>
        </Card>
      </Stack>

      <Card>
        <CardContent>
          <AdminTable
            rows={summary}
            initialState={{ sorting: { sortModel: [{ field: 'id', sort: 'desc' }] } }}
            columns={[
              { field: 'id', headerName: 'ID', width: 90 },
              { field: 'category', headerName: '분류', width: 120 },
              {
                field: 'title',
                headerName: '제목',
                flex: 1.4,
                renderCell: (params: any) => (
                  <Typography
                    variant="body2"
                    sx={{ cursor: 'pointer', textDecoration: 'underline', '&:hover': { color: 'primary.main' } }}
                    onClick={() => {
                      setSelectedId(params.row.id);
                      setDetailOpen(true);
                    }}
                  >
                    {params.row.title}
                  </Typography>
                ),
              },
              {
                field: 'status',
                headerName: '상태',
                width: 130,
                renderCell: (params: any) => renderStatus(params.row.status),
              },
              { field: 'assignee', headerName: '담당자', width: 130 },
              { field: 'createdAt', headerName: '접수일', width: 130 },
              {
                field: 'action',
                headerName: '처리',
                width: 220,
                sortable: false,
                renderCell: (params: any) => {
                  const status = params.row.status;
                  return (
                    <Stack direction="row" spacing={0.5}>
                      {status === 'OPEN' && (
                        <>
                          {isAdmin ? (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setAssignInquiryId(params.row.id);
                                setSelectedOperatorId('');
                                setAssignDialogOpen(true);
                              }}
                            >
                              배정
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() =>
                                adminApi.inquiryAssign(params.row.id).then(() => {
                                  show('문의가 배정되었습니다.', 'success');
                                  queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] });
                                })
                              }
                            >
                              배정받기
                            </Button>
                          )}
                        </>
                      )}
                      {status === 'ASSIGNED' && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            setSelectedId(params.row.id);
                            setOpen(true);
                          }}
                        >
                          답변
                        </Button>
                      )}
                    </Stack>
                  );
                },
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* 답변 등록 다이얼로그 */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>문의 답변 등록</DialogTitle>
        <DialogContent>
          <TextField
            sx={{ mt: 1 }}
            label="답변"
            fullWidth
            multiline
            minRows={5}
            {...register('answer')}
            error={!!errors.answer}
            helperText={errors.answer?.message}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSubmit(submitAnswer)}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 문의 상세보기 다이얼로그 */}
      <Dialog
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedId(null); }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>문의 상세</DialogTitle>
        <DialogContent>
          {detailQuery.isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
          {detailQuery.isError && (
            <Typography color="error" sx={{ py: 2 }}>문의 정보를 불러올 수 없습니다.</Typography>
          )}
          {detail && !detailQuery.isLoading && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={2}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>분류</Typography>
                <Typography variant="body2">{detail.category}</Typography>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>상태</Typography>
                {renderStatus(detail.status)}
              </Stack>
              <Stack direction="row" spacing={2}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>담당자</Typography>
                <Typography variant="body2">{detail.assignedOperatorName || '미배정'}</Typography>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>접수일</Typography>
                <Typography variant="body2">{detail.createdAt}</Typography>
              </Stack>
              <Divider />
              <Typography variant="subtitle1" fontWeight={700}>{detail.title}</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{detail.content}</Typography>

              {detail.replies && detail.replies.length > 0 && (
                <>
                  <Divider />
                  <Typography variant="subtitle2" fontWeight={700}>답변 목록</Typography>
                  {detail.replies.map((reply: any) => (
                    <Card key={reply.id} variant="outlined" sx={{ p: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" fontWeight={700}>
                          {reply.authorName} {reply.isStaffReply && <Chip size="small" label="상담원" color="info" sx={{ ml: 0.5 }} />}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{reply.createdAt}</Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{reply.content}</Typography>
                    </Card>
                  ))}
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDetailOpen(false); setSelectedId(null); }}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 상담원 배정 다이얼로그 (관리자용) */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>문의 배정</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>상담원 선택</InputLabel>
            <Select
              value={selectedOperatorId}
              label="상담원 선택"
              onChange={(e) => setSelectedOperatorId(e.target.value as number | '')}
            >
              {(operatorsQuery.data || []).map((op: any) => (
                <MenuItem key={op.id} value={op.id}>
                  {op.name} ({op.role === 'ADMIN' ? '관리자' : '상담원'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>취소</Button>
          <Button
            variant="contained"
            disabled={!selectedOperatorId}
            onClick={async () => {
              if (assignInquiryId && selectedOperatorId) {
                try {
                  await adminApi.inquiryAssignToOperator(assignInquiryId, selectedOperatorId as number);
                  show('문의가 배정되었습니다.', 'success');
                  queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] });
                  setAssignDialogOpen(false);
                } catch {
                  show('배정에 실패했습니다.', 'error');
                }
              }
            }}
          >
            배정
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
