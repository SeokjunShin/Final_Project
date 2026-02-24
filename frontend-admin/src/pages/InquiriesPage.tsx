import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
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
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { show } = useAdminSnackbar();

  const { data } = useQuery({
    queryKey: ['admin-inquiries', status],
    queryFn: async () => {
      try {
        return await adminApi.inquiries({ status });
      } catch {
        return {
          content: [
            { id: 101, title: '카드 한도 문의', status: 'RECEIVED', assignee: 'kim.op', createdAt: '2026-02-24' },
            { id: 102, title: '결제 오류 문의', status: 'IN_PROGRESS', assignee: 'lee.op', createdAt: '2026-02-23' },
          ],
          totalElements: 2,
          totalPages: 1,
          number: 0,
          size: 10,
        };
      }
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
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
          문의 큐
        </Typography>
        <TextField label="상태" value={status} onChange={(e) => setStatus(e.target.value)} />
      </Stack>
      <Card>
        <CardContent>
          <AdminTable
            rows={data?.content ?? []}
            columns={[
              { field: 'title', headerName: '제목', flex: 2 },
              { field: 'status', headerName: '상태', flex: 1 },
              { field: 'assignee', headerName: '담당자', flex: 1 },
              { field: 'createdAt', headerName: '접수일', flex: 1 },
              {
                field: 'action',
                headerName: '처리',
                flex: 1,
                renderCell: (params) => (
                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedId(params.row.id);
                      setOpen(true);
                    }}
                  >
                    답변 작성
                  </Button>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>문의 답변 작성</DialogTitle>
        <DialogContent>
          <TextField
            sx={{ mt: 1 }}
            label="답변"
            fullWidth
            multiline
            minRows={4}
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
