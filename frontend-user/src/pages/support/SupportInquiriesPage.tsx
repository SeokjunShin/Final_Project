import { zodResolver } from '@hookform/resolvers/zod';
import { Add } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supportApi } from '@/api';
import { TableSection } from '@/components/common/TableSection';
import { useSnackbar } from '@/contexts/SnackbarContext';

const schema = z.object({
  title: z.string().min(1, '제목을 입력하세요.'),
  content: z.string().min(5, '내용을 5자 이상 입력하세요.'),
});

type InquiryForm = z.infer<typeof schema>;

export const SupportInquiriesPage = () => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const { show } = useSnackbar();

  const { data } = useQuery({
    queryKey: ['support-inquiries'],
    queryFn: async () => {
      try {
        return await supportApi.list();
      } catch {
        return [
          { id: 1, title: '카드 승인 오류 문의', status: 'ANSWERED', createdAt: '2026-02-20', hasAttachment: true },
          { id: 2, title: '포인트 전환 지연', status: 'IN_PROGRESS', createdAt: '2026-02-23', hasAttachment: false },
        ];
      }
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (value: InquiryForm) => {
    const form = new FormData();
    form.append('title', value.title);
    form.append('content', value.content);
    if (file) {
      form.append('attachment', file);
    }
    await supportApi.create(form).catch(() => null);
    show('문의가 등록되었습니다.', 'success');
    setOpen(false);
    setFile(null);
    reset();
    queryClient.invalidateQueries({ queryKey: ['support-inquiries'] });
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          고객센터 - 문의
        </Typography>
        <Button startIcon={<Add />} variant="contained" onClick={() => setOpen(true)}>
          문의 등록
        </Button>
      </Stack>
      <Card>
        <CardContent>
          <TableSection
            rows={data ?? []}
            columns={[
              { field: 'id', headerName: '번호', flex: 1 },
              { field: 'title', headerName: '제목', flex: 2 },
              { field: 'status', headerName: '상태', flex: 1 },
              { field: 'createdAt', headerName: '등록일', flex: 1 },
              { field: 'hasAttachment', headerName: '첨부', flex: 1, valueFormatter: (v: boolean) => (v ? '있음' : '없음') },
            ]}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>문의 등록</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="제목" {...register('title')} error={!!errors.title} helperText={errors.title?.message} />
            <TextField
              label="내용"
              multiline
              minRows={4}
              {...register('content')}
              error={!!errors.content}
              helperText={errors.content?.message}
            />
            <Button component="label" variant="outlined">
              첨부 파일 선택
              <input hidden type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Button>
            {file ? <Typography variant="caption">선택: {file.name}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} variant="contained">
            등록
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
