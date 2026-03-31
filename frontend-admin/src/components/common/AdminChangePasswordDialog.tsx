import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminAuthApi } from '@/api/auth';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';

const schema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
  newPassword: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/, '영문, 숫자, 특수문자를 포함해야 합니다.'),
  confirmPassword: z.string().min(1, '새 비밀번호 확인을 입력해주세요.'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '새 비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export const AdminChangePasswordDialog = ({ open, onClose }: Props) => {
  const { show } = useAdminSnackbar();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await adminAuthApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      show('비밀번호가 성공적으로 변경되었습니다.', 'success');
      reset();
      onClose();
    } catch (error: any) {
      show(error?.response?.data?.message || '비밀번호 변경에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>관리자 비밀번호 변경</DialogTitle>
      <DialogContent dividers>
        <Stack component="form" spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="현재 비밀번호"
            type="password"
            fullWidth
            {...register('currentPassword')}
            error={!!errors.currentPassword}
            helperText={errors.currentPassword?.message}
          />
          <TextField
            label="새 비밀번호"
            type="password"
            fullWidth
            {...register('newPassword')}
            error={!!errors.newPassword}
            helperText={errors.newPassword?.message}
          />
          <TextField
            label="새 비밀번호 확인"
            type="password"
            fullWidth
            {...register('confirmPassword')}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          취소
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={loading}
          sx={{ bgcolor: '#16233d', '&:hover': { bgcolor: '#0d1626' } }}
        >
          {loading ? '변경 중...' : '비밀번호 변경'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
