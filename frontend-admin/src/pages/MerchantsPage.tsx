import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';

const schema = z.object({
  name: z.string().min(1, '가맹점명을 입력하세요.'),
  businessNo: z.string().min(3, '사업자번호를 입력하세요.'),
});

type FormValues = z.infer<typeof schema>;

export const MerchantsPage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-merchants'],
    queryFn: async () => {
      return await adminApi.merchants();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (value: FormValues) => {
    await adminApi.saveMerchant(value).catch(() => null);
    reset();
    queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        가맹점 관리
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack component="form" onSubmit={handleSubmit(onSubmit)} direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="가맹점명" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
            <TextField label="사업자번호" {...register('businessNo')} error={!!errors.businessNo} helperText={errors.businessNo?.message} />
            <Button type="submit" variant="contained">
              등록
            </Button>
          </Stack>
        </CardContent>
      </Card>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">가맹점 데이터를 불러올 수 없습니다.</Typography>
        </Box>
      ) : (!data || data.length === 0) ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">등록된 가맹점이 없습니다.</Typography>
        </Box>
      ) : (
        <AdminTable
          rows={data}
          columns={[
            { field: 'name', headerName: '가맹점명', flex: 2 },
            { field: 'businessNo', headerName: '사업자번호', flex: 1 },
            { field: 'status', headerName: '상태', flex: 1 },
          ]}
        />
      )}
    </Box>
  );
};
