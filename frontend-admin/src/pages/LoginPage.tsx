import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';

const schema = z.object({
  email: z.string().min(1, '이메일을 입력하세요.'),
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
      // 역할별 기본 페이지로 직접 이동
      const profile = JSON.parse(localStorage.getItem('admin_profile') || '{}');
      if (profile.role === 'REVIEW_ADMIN') {
        navigate('/card-applications', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const status = err?.response?.status;
      const data = err?.response?.data;
      const errCode = data?.code;
      const msg = data?.message;
      const remainingAttempts =
        typeof data?.remainingAttempts === 'number' && Number.isFinite(data.remainingAttempts)
          ? Math.max(0, Math.floor(data.remainingAttempts))
          : undefined;
      const retryAfterSeconds =
        typeof data?.retryAfterSeconds === 'number' && Number.isFinite(data.retryAfterSeconds)
          ? Math.max(0, Math.ceil(data.retryAfterSeconds))
          : undefined;
      const attemptsMessage =
        typeof remainingAttempts === 'number' && errCode === 'INVALID_CREDENTIALS'
          ? ` 남은 시도 ${remainingAttempts}회`
          : '';
      const remainingMessage =
        retryAfterSeconds && retryAfterSeconds > 0
          ? ` 남은 대기 시간 ${Math.floor(retryAfterSeconds / 60)}분 ${retryAfterSeconds % 60}초`
          : '';

      if (status === 423 || errCode === 'ACCOUNT_LOCKED' || msg?.includes('잠겨')) {
        show(`${msg || '계정이 잠겼습니다. 잠시 후 다시 시도해주세요.'}${remainingMessage}`, 'error');
      } else {
        show(`${msg || '로그인에 실패했습니다.'}${attemptsMessage}${remainingMessage}`, 'error');
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        background: 'radial-gradient(circle at 80% 20%, #294a86 0%, #1b2b48 32%, #101a2d 100%)',
      }}
    >
      <Card sx={{ width: 'min(460px, 100%)', border: '1px solid rgba(255,255,255,0.18)', bgcolor: 'rgba(255,255,255,0.95)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 0.6 }}>
            운영 포털 로그인
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            admin.mycard.local · OPERATOR / MASTER_ADMIN / REVIEW_ADMIN
          </Typography>

          <Stack spacing={1.6} component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField label="이메일" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
            <TextField label="비밀번호" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              로그인
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
