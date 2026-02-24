import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';

const schema = z.object({
  username: z.string().min(1, '아이디를 입력하세요.'),
  password: z.string().min(1, '비밀번호를 입력하세요.'),
});

type FormValues = z.infer<typeof schema>;

export const AdminLoginPage = () => {
  const { login } = useAdminAuth();
  const { show } = useAdminSnackbar();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (value: FormValues) => {
    try {
      await login(value);
      show('로그인되었습니다.', 'success');
      navigate('/dashboard');
    } catch {
      show('로그인에 실패했습니다.', 'error');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: '#f5f7fb' }}>
      <Card sx={{ width: 420 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
            관리자 로그인
          </Typography>
          <Stack spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField label="아이디" {...register('username')} error={!!errors.username} helperText={errors.username?.message} />
            <TextField label="비밀번호" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              로그인
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
