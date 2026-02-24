import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
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
  const { data } = useQuery({
    queryKey: ['admin-point-policy'],
    queryFn: async () => {
      try {
        return await adminApi.pointPolicy();
      } catch {
        return { feeRate: 2.5, dailyLimit: 500000 };
      }
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), values: { feeRate: data?.feeRate ?? 0, dailyLimit: data?.dailyLimit ?? 0 } });

  const onSubmit = async (form: FormValues) => {
    await adminApi.savePointPolicy(form).catch(() => null);
    show('포인트 정책이 저장되었습니다.', 'success');
  };

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
