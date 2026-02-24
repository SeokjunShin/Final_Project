import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { authApi } from '@/api/auth';

const schema = z
  .object({
    email: z.string().email('유효한 이메일을 입력하세요.'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/, '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.'),
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력하세요.'),
    name: z.string().min(1, '이름을 입력하세요.').max(80, '이름은 80자 이하로 입력하세요.'),
    phone: z
      .string()
      .regex(/^\d{2,3}-\d{3,4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)')
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

type FormValues = z.infer<typeof schema>;

export const RegisterPage = () => {
  const { show } = useSnackbar();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (value: FormValues) => {
    try {
      await authApi.register({
        email: value.email,
        password: value.password,
        name: value.name,
        phone: value.phone || undefined,
      });
      show('회원가입이 완료되었습니다. 로그인해주세요.', 'success');
      navigate('/login');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '회원가입에 실패했습니다.';
      show(message, 'error');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: '#f5f7fb' }}>
      <Card sx={{ width: 420 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
            MyCard 회원가입
          </Typography>
          <Stack spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField label="이메일" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
            <TextField label="비밀번호" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
            <TextField
              label="비밀번호 확인"
              type="password"
              {...register('passwordConfirm')}
              error={!!errors.passwordConfirm}
              helperText={errors.passwordConfirm?.message}
            />
            <TextField label="이름" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
            <TextField
              label="전화번호 (선택)"
              placeholder="010-1234-5678"
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message}
            />
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              회원가입
            </Button>
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              이미 계정이 있으신가요?{' '}
              <Link component={RouterLink} to="/login">
                로그인
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
