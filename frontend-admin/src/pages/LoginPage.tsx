import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { adminAuthApi } from '@/api/auth';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';

const schema = z.object({
  email: z.string().email('이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력하세요.'),
});

const resetSchema = z.object({
  email: z.string().email('이메일 형식이 아닙니다.'),
  pin: z.string().regex(/^\d{4}$/, '4자리 숫자를 입력하세요.'),
  newPassword: z.string().min(1, '새 비밀번호를 입력하세요.'),
  confirmPassword: z.string().min(1, '새 비밀번호 확인을 입력하세요.'),
}).refine((value) => value.newPassword === value.confirmPassword, {
  message: '새 비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export const AdminLoginPage = () => {
  const { login } = useAdminAuth();
  const { show } = useAdminSnackbar();
  const navigate = useNavigate();
  const [resetOpen, setResetOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    reset: resetResetForm,
    formState: { errors: resetErrors, isSubmitting: isResetSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: '',
      pin: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (value: FormValues) => {
    try {
      await login(value);
      show('로그인되었습니다.', 'success');
      const profile = JSON.parse(localStorage.getItem('admin_profile') || '{}');
      if (profile.role === 'REVIEW_ADMIN') {
        navigate('/card-applications', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch {
      show('로그인에 실패했습니다.', 'error');
    }
  };

  const onResetPassword = async (value: ResetFormValues) => {
    try {
      await adminAuthApi.resetPassword({
        email: value.email,
        pin: value.pin,
        newPassword: value.newPassword,
      });
      show('비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해 주세요.', 'success');
      setResetOpen(false);
      resetResetForm();
    } catch (error: any) {
      show(error?.response?.data?.message || '비밀번호 재설정에 실패했습니다.', 'error');
    }
  };

  return (
    <>
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
              <Button type="button" variant="text" onClick={() => setResetOpen(true)}>
                비밀번호 재설정
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>관리자 비밀번호 재설정</DialogTitle>
        <DialogContent dividers>
          <Stack component="form" spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="관리자 이메일"
              error={!!resetErrors.email}
              helperText={resetErrors.email?.message}
              {...registerReset('email')}
            />
            <TextField
              label="4자리 번호"
              type="password"
              inputProps={{ maxLength: 4, inputMode: 'numeric', pattern: '[0-9]*' }}
              error={!!resetErrors.pin}
              helperText={resetErrors.pin?.message || 'DB에 저장된 관리자 전용 4자리 번호를 입력하세요.'}
              {...registerReset('pin')}
            />
            <TextField
              label="새 비밀번호"
              type="password"
              error={!!resetErrors.newPassword}
              helperText={resetErrors.newPassword?.message}
              {...registerReset('newPassword')}
            />
            <TextField
              label="새 비밀번호 확인"
              type="password"
              error={!!resetErrors.confirmPassword}
              helperText={resetErrors.confirmPassword?.message}
              {...registerReset('confirmPassword')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setResetOpen(false);
              resetResetForm();
            }}
            color="inherit"
          >
            취소
          </Button>
          <Button
            onClick={handleResetSubmit(onResetPassword)}
            variant="contained"
            disabled={isResetSubmitting}
          >
            재설정
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
