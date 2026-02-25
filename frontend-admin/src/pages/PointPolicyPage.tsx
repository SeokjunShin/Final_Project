import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { adminApi } from '@/api';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';

const schema = z.object({
  feeRate: z.coerce.number().min(0, '0 이상 입력하세요.'),
  dailyLimit: z.coerce.number().min(1000, '1000 이상 입력하세요.'),
});

type FormValues = z.infer<typeof schema>;

export const PointPolicyPage = () => {
  const { show } = useAdminSnackbar();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-point-policy'],
    queryFn: async () => {
      return await adminApi.pointPolicy();
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), values: { feeRate: data?.feeRate ?? 0, dailyLimit: data?.dailyLimit ?? 0 } });

  const onSubmit = async (form: FormValues) => {
    try {
      await adminApi.savePointPolicy(form);
      queryClient.invalidateQueries({ queryKey: ['admin-point-policy'] });
      show('포인트 정책이 저장되었습니다.', 'success');
    } catch {
      show('포인트 정책 저장에 실패했습니다.', 'error');
    }
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
        <Typography color="text.secondary">포인트 정책을 불러올 수 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        포인트 정책
      </Typography>
      <Card>
        <CardContent>
          <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
            <TextField label="수수료(%)" {...register('feeRate')} error={!!errors.feeRate} helperText={errors.feeRate?.message} />
            <TextField label="1일 한도(원)" {...register('dailyLimit')} error={!!errors.dailyLimit} helperText={errors.dailyLimit?.message} />
            <Button type="submit" variant="contained" sx={{ width: 150 }}>
              저장
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
