import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from '@/contexts/SnackbarContext';

const schema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요.'),
  password: z.string().min(1, '비밀번호를 입력하세요.'),
});

type FormValues = z.infer<typeof schema>;

export const LoginPage = () => {
  const { login } = useAuth();
  const { show } = useSnackbar();
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
            MyCard 로그인
          </Typography>
          <Stack spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField label="이메일" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
            <TextField label="비밀번호" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              로그인
            </Button>
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              아직 계정이 없으신가요?{' '}
              <Link component={RouterLink} to="/register">
                회원가입
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
