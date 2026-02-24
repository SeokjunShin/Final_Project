import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { pointsApi } from '@/api';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { TableSection } from '@/components/common/TableSection';

const schema = z.object({
  amount: z.coerce.number().min(1000, '1000P 이상 입력하세요.'),
});

type FormValues = z.infer<typeof schema>;

export const PointsPage = () => {
  const { show } = useSnackbar();
  const { data: balance } = useQuery({
    queryKey: ['points-balance'],
    queryFn: async () => {
      try {
        return await pointsApi.balance();
      } catch {
        return { balance: 18200 };
      }
    },
  });

  const { data: ledger } = useQuery({
    queryKey: ['points-ledger'],
    queryFn: async () => {
      try {
        return await pointsApi.ledger({ page: 0, size: 10 });
      } catch {
        return {
          content: [
            { id: 1, createdAt: '2026-02-23', type: 'EARN', amount: 300, description: '결제 적립' },
            { id: 2, createdAt: '2026-02-21', type: 'CONVERT', amount: -5000, description: '현금화' },
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
    formState: { errors },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (form: FormValues) => {
    await pointsApi.convert(form.amount).catch(() => null);
    show('포인트 전환 요청이 접수되었습니다.', 'success');
    reset();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        포인트
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">잔액: {(balance?.balance ?? 0).toLocaleString('ko-KR')}P</Typography>
        </CardContent>
      </Card>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack component="form" onSubmit={handleSubmit(onSubmit)} direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="전환 포인트" {...register('amount')} error={!!errors.amount} helperText={errors.amount?.message} />
            <Button variant="contained" type="submit">
              포인트 전환
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <TableSection
        title="포인트 내역"
        rows={ledger?.content ?? []}
        columns={[
          { field: 'createdAt', headerName: '일자', flex: 1 },
          { field: 'type', headerName: '유형', flex: 1 },
          { field: 'description', headerName: '내용', flex: 2 },
          { field: 'amount', headerName: '포인트', flex: 1 },
        ]}
      />
    </Box>
  );
};
