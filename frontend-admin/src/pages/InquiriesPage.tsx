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
  MenuItem,
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

const schema = z.object({
  answer: z.string().min(5, '답변을 5자 이상 입력하세요.'),
});

type FormValues = z.infer<typeof schema>;

export const InquiriesPage = () => {
  const [queue, setQueue] = useState('unassigned');
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { show } = useAdminSnackbar();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-inquiries', queue],
    queryFn: async () => {
      return await adminApi.inquiries({ queue, page: 0, size: 30 });
    },
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
            columns={[
              { field: 'id', headerName: 'ID', width: 90 },
              { field: 'category', headerName: '분류', width: 120 },
              { field: 'title', headerName: '제목', flex: 1.4 },
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
                width: 280,
                sortable: false,
                renderCell: (params: any) => (
                  <Stack direction="row" spacing={0.5}>
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
                      배정
                    </Button>
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
                    <Button
                      size="small"
                      color="success"
                      onClick={() =>
                        adminApi.inquiryResolve(params.row.id).then(() => {
                          show('문의가 종료되었습니다.', 'success');
                          queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] });
                        })
                      }
                    >
                      종료
                    </Button>
                  </Stack>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

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
    </Box>
  );
};
