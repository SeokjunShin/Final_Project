import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
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
  const { data } = useQuery({
    queryKey: ['admin-merchants'],
    queryFn: async () => {
      try {
        return await adminApi.merchants();
      } catch {
        return [
          { id: 1, name: '가맹점A', businessNo: '123-45-67890', status: 'ACTIVE' },
          { id: 2, name: '가맹점B', businessNo: '444-55-88888', status: 'ACTIVE' },
        ];
      }
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
      <AdminTable
        rows={data ?? []}
        columns={[
          { field: 'name', headerName: '가맹점명', flex: 2 },
          { field: 'businessNo', headerName: '사업자번호', flex: 1 },
          { field: 'status', headerName: '상태', flex: 1 },
        ]}
      />
    </Box>
  );
};
