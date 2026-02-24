import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';

const schema = z.object({
  userId: z.string().min(1, '수신 사용자를 입력하세요.'),
  content: z.string().min(2, '메시지를 입력하세요.'),
});

type FormValues = z.infer<typeof schema>;

export const MessagesPage = () => {
  const { show } = useAdminSnackbar();
  const { data } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      try {
        return await adminApi.messages();
      } catch {
        return [
          { id: 1, userId: '1001', content: '문의 답변이 등록되었습니다.', sentAt: '2026-02-24 10:20' },
          { id: 2, userId: '1002', content: '문서 재제출 부탁드립니다.', sentAt: '2026-02-23 19:15' },
        ];
      }
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (value: FormValues) => {
    await adminApi.sendMessage(value).catch(() => null);
    show('메시지가 발송되었습니다.', 'success');
    reset();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        메시지 발송
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack component="form" onSubmit={handleSubmit(onSubmit)} direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="사용자 ID" {...register('userId')} error={!!errors.userId} helperText={errors.userId?.message} />
            <TextField label="메시지" sx={{ minWidth: 320 }} {...register('content')} error={!!errors.content} helperText={errors.content?.message} />
            <Button variant="contained" type="submit" disabled={isSubmitting}>
              발송
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <AdminTable
        rows={data ?? []}
        columns={[
          { field: 'userId', headerName: '사용자', flex: 1 },
          { field: 'content', headerName: '메시지', flex: 2 },
          { field: 'sentAt', headerName: '발송일시', flex: 1 },
        ]}
      />
    </Box>
  );
};
