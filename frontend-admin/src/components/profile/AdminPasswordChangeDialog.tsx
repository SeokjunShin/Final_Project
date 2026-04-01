import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { adminAuthApi } from '@/api/auth';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useAdminSnackbar } from '@/contexts/SnackbarContext';

interface AdminPasswordChangeDialogProps {
  open: boolean;
  onClose: () => void;
}

const resolveErrorMessage = (error: any) => {
  const firstFieldError = error?.response?.data?.errors?.[0]?.message;
  return firstFieldError || error?.response?.data?.message || '관리자 비밀번호를 다시 설정해 주세요.';
};

const initialForm = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
  pemKey: '',
};

export const AdminPasswordChangeDialog = ({ open, onClose }: AdminPasswordChangeDialogProps) => {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const { show } = useAdminSnackbar();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  const isValid = useMemo(
    () =>
      Boolean(
        form.currentPassword &&
        form.newPassword &&
        form.newPasswordConfirm &&
        form.pemKey.trim() &&
        form.newPassword === form.newPasswordConfirm,
      ),
    [form],
  );

  const resetAndClose = () => {
    setForm(initialForm);
    onClose();
  };

  const handleSubmit = async () => {
    if (!isValid) {
      show('입력값을 확인해주세요. 새 비밀번호 확인과 PEM 키는 필수입니다.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await adminAuthApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        pemKey: form.pemKey,
      });
      show('관리자 비밀번호가 변경되었습니다. 다시 로그인해주세요.', 'success');
      resetAndClose();
      await logout();
      navigate('/login', { replace: true });
    } catch (err: any) {
      show(resolveErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : resetAndClose} fullWidth maxWidth="sm">
      <DialogTitle>관리자 비밀번호 변경</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="warning">
            현재 비밀번호와 PEM 키 검증이 모두 통과해야 변경됩니다. 성공 시 모든 관리자 세션이 종료됩니다.
          </Alert>
          <TextField
            label="현재 비밀번호"
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
            fullWidth
          />
          <TextField
            label="새 비밀번호"
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            helperText="8자 이상, 대문자/소문자/숫자/특수문자를 각각 1개 이상 포함하세요."
            fullWidth
          />
          <TextField
            label="새 비밀번호 확인"
            type="password"
            value={form.newPasswordConfirm}
            error={Boolean(form.newPasswordConfirm) && form.newPassword !== form.newPasswordConfirm}
            helperText={
              form.newPasswordConfirm && form.newPassword !== form.newPasswordConfirm
                ? '새 비밀번호가 일치하지 않습니다.'
                : ' '
            }
            onChange={(e) => setForm((prev) => ({ ...prev, newPasswordConfirm: e.target.value }))}
            fullWidth
          />
          <TextField
            label="PEM 키"
            value={form.pemKey}
            onChange={(e) => setForm((prev) => ({ ...prev, pemKey: e.target.value }))}
            multiline
            minRows={8}
            placeholder={'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'}
            fullWidth
          />
          <Box sx={{ px: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              내부 운영용 검증 키입니다. 서버에는 허용된 공개키만 저장되며, 입력한 PEM은 이번 변경 요청 검증에만 사용됩니다.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={resetAndClose} disabled={submitting}>
          취소
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!isValid || submitting}>
          변경하기
        </Button>
      </DialogActions>
    </Dialog>
  );
};
