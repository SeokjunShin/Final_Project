import { useEffect, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { authApi as publicAuthApi } from '@/api/auth';
import { SecureKeypad } from '@/components/common/SecureKeypad';
import platinumCard from '@/assets/cards/mycard-platinum.svg';
import portalBg from '@/assets/hero/portal-bg.svg';

const schema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요.'),
  password: z.string().min(1, '비밀번호를 입력하세요.'),
});

type FormValues = z.infer<typeof schema>;

export const LoginPage = () => {
  const { login, loginReactivate, cancelWithdrawalAndLogin } = useAuth();
  const { show } = useSnackbar();
  const navigate = useNavigate();

  const [loginError, setLoginError] = useState<{ code?: string; message?: string } | null>(null);
  const [cancelWithdrawalOpen, setCancelWithdrawalOpen] = useState(false);
  const [cancelSecondaryPassword, setCancelSecondaryPassword] = useState('');
  const [cancelWithdrawalError, setCancelWithdrawalError] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (value: FormValues) => {
    setLoginError(null);
    try {
      await login(value);
      show('로그인되었습니다.', 'success');
      navigate('/');
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { code?: string; message?: string } } })?.response?.data;
      const code = data?.code;
      const message = data?.message;
      setLoginError({ code, message: message ?? '로그인에 실패했습니다.' });
    }
  };

  const openResetDialog = () => {
    setResetOpen(true);
    setResetStep(1);
    setResetEmail('');
    setSecurityQuestion('');
    setSecurityAnswer('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setResetError('');
    setResetSuccessMessage('');
  };

  const closeCancelWithdrawalDialog = () => {
    setCancelWithdrawalOpen(false);
    setCancelSecondaryPassword('');
    setCancelWithdrawalError('');
  };

  useEffect(() => {
    if (cancelSecondaryPassword.length !== 6 || !cancelWithdrawalOpen) {
      return;
    }

    const execute = async () => {
      const values = getValues();
      try {
        await cancelWithdrawalAndLogin({
          email: values.email,
          password: values.password,
          secondaryPassword: cancelSecondaryPassword,
        });
        closeCancelWithdrawalDialog();
        setLoginError(null);
        show('탈퇴 예약이 취소되고 다시 로그인되었습니다.', 'success');
        navigate('/');
      } catch (e: unknown) {
        const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
        setCancelWithdrawalError(data?.message ?? '탈퇴 예약 취소에 실패했습니다. 정보를 다시 확인해 주세요.');
        setCancelSecondaryPassword('');
      }
    };

    void execute();
  }, [cancelSecondaryPassword, cancelWithdrawalOpen, cancelWithdrawalAndLogin, getValues, navigate, show]);

  const handleRequestReset = async () => {
    setResetLoading(true);
    setResetError('');
    setResetSuccessMessage('');
    try {
      const result = await publicAuthApi.requestPasswordReset(resetEmail);
      setSecurityQuestion(result.securityQuestion);
      setResetStep(2);
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
      setResetError(data?.message ?? '이메일을 찾을 수 없거나 보안 질문이 등록되지 않았습니다.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyRecoveryAnswer = async () => {
    if (!securityAnswer.trim()) {
      setResetError('보안 답변을 입력해주세요.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetSuccessMessage('');
    try {
      const result = await publicAuthApi.verifyPasswordRecovery({
        email: resetEmail,
        securityAnswer: securityAnswer.trim(),
      });
      setResetSuccessMessage(result.message || '인증되었습니다.');
      setResetStep(3);
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
      setResetError(data?.message ?? '보안 답변 인증에 실패했습니다.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    if (newPassword !== newPasswordConfirm) {
      setResetError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetSuccessMessage('');
    try {
      await publicAuthApi.confirmPasswordReset({
        email: resetEmail,
        securityAnswer: securityAnswer.trim(),
        newPassword,
      });
      show('비밀번호가 복구되었습니다. 새 비밀번호로 로그인하세요.', 'success');
      setResetOpen(false);
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
      setResetError(data?.message ?? '비밀번호 복구에 실패했습니다.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(130deg, #e8f0ff 0%, #f7fbff 48%, #eaf5f2 100%)',
        px: 2,
      }}
    >
      <Box
        sx={{
          width: 'min(1140px, 100%)',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.15fr 0.85fr' },
          gap: 2,
        }}
      >
        <Card sx={{ display: { xs: 'none', lg: 'block' }, p: 3, backgroundImage: `url(${portalBg})`, backgroundSize: 'cover' }}>
          <Typography variant="h4" sx={{ mb: 1.2 }}>
            MyCard 고객 포털
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            결제 예정액, 명세서, 승인내역, 문의/문서함을 한 화면에서 관리하세요.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box component="img" src={platinumCard} alt="MyCard 카드" sx={{ width: '92%', maxWidth: 620 }} />
          </Box>
        </Card>

        <Card sx={{ p: 1.5 }}>
          <CardContent>
            <Link component={RouterLink} to="/" sx={{ textDecoration: 'none', color: '#d32f2f', fontWeight: 800, fontSize: '1.3rem', display: 'block', mb: 2 }}>
              MyCard
            </Link>
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              로그인
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              사용자 포털(mycard.local)
            </Typography>
            <Stack spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
              {loginError && (
                <Alert severity="error" onClose={() => setLoginError(null)}>
                  {loginError.message}
                  {loginError.code === 'ACCOUNT_DISABLED' && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        비활성 상태인 계정입니다. 계속 사용하시려면 비밀번호를 다시 확인하고 비활성화를 해제해 주세요.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={async () => {
                          const values = getValues();
                          try {
                            await loginReactivate(values);
                            show('비활성이 해제되고 로그인되었습니다.', 'success');
                            navigate('/');
                          } catch (e: unknown) {
                            const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
                            setLoginError({
                              code: 'REACTIVATE_FAILED',
                              message: data?.message ?? '비활성 해제에 실패했습니다. 이메일/비밀번호를 다시 확인해 주세요.',
                            });
                          }
                        }}
                      >
                        비활성 해제 후 로그인
                      </Button>
                    </Box>
                  )}
                  {loginError.code === 'WITHDRAWAL_PENDING' && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        아직 15분이 지나지 않았다면 탈퇴 예약을 취소하고 다시 로그인할 수 있습니다.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setCancelWithdrawalOpen(true);
                          setCancelSecondaryPassword('');
                          setCancelWithdrawalError('');
                        }}
                      >
                        탈퇴 예약 취소 후 로그인
                      </Button>
                    </Box>
                  )}
                  {loginError.code === 'ACCOUNT_LOCKED' && (
                    <Typography component="span" sx={{ display: 'block', mt: 0.5 }}>
                      <Link component={RouterLink} to="/account/request-activation" underline="hover" sx={{ fontWeight: 600 }}>
                        잠금 해제/문의 페이지로 이동
                      </Link>
                    </Typography>
                  )}
                </Alert>
              )}
              <TextField label="이메일" autoComplete="username" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
              <TextField
                label="비밀번호"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
              <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                로그인
              </Button>
              <Button variant="text" onClick={openResetDialog}>
                비밀번호 복구
              </Button>
              <Typography variant="body2" sx={{ textAlign: 'center' }}>
                아직 계정이 없으신가요?{' '}
                <Link component={RouterLink} to="/register" underline="hover">
                  회원가입
                </Link>
              </Typography>
              <Button
                component={RouterLink}
                to="/"
                variant="outlined"
                size="medium"
                fullWidth
                sx={{ color: 'text.secondary', borderColor: 'divider' }}
              >
                ← 메인 페이지로 돌아가기
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>비밀번호 복구</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {resetStep === 1 && (
              <Typography variant="body2" color="text.secondary">
                복구받을 이메일을 입력하세요.
              </Typography>
            )}
            <TextField
              label="이메일"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              fullWidth
              disabled={resetStep !== 1}
            />
            {resetStep >= 2 && (
              <>
                <Typography
                  variant="body2"
                  sx={{ bgcolor: '#f0f4ff', border: '1px solid #c5d5ff', borderRadius: 1, p: 1.5, color: '#1a237e', fontWeight: 500 }}
                >
                  🔐 보안 질문: {securityQuestion}
                </Typography>
                {resetStep === 2 && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      가입 시 등록한 보안 질문 답변으로 비밀번호를 복구합니다.
                    </Typography>
                    <TextField
                      label="보안 답변"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      fullWidth
                      placeholder="가입 시 입력한 답변을 입력하세요"
                    />
                  </>
                )}
                {resetStep === 3 && (
                  <>
                    {resetSuccessMessage && (
                      <Alert severity="success">{resetSuccessMessage}</Alert>
                    )}
                    <TextField
                      label="새 비밀번호"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="새 비밀번호 확인"
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      fullWidth
                    />
                  </>
                )}
              </>
            )}
            {resetError && (
              <Alert severity="error">{resetError}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)} disabled={resetLoading}>
            취소
          </Button>
          {resetStep === 1 ? (
            <Button
              variant="contained"
              onClick={handleRequestReset}
              disabled={resetLoading || !resetEmail}
            >
              다음
            </Button>
          ) : resetStep === 2 ? (
            <Button
              variant="contained"
              onClick={handleVerifyRecoveryAnswer}
              disabled={resetLoading || !securityAnswer.trim()}
            >
              인증
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleConfirmReset}
              disabled={resetLoading || !newPassword || !newPasswordConfirm}
            >
              비밀번호 변경
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={cancelWithdrawalOpen} onClose={closeCancelWithdrawalDialog} fullWidth maxWidth="xs">
        <DialogTitle>탈퇴 예약 취소</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.6, mb: 3 }}>
            탈퇴 예약을 취소하고 다시 로그인하려면<br />
            2차 비밀번호를 입력해 주세요.
          </Typography>
          <SecureKeypad
            value={cancelSecondaryPassword}
            onChange={(value) => {
              setCancelSecondaryPassword(value);
              setCancelWithdrawalError('');
            }}
          />
          {cancelWithdrawalError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {cancelWithdrawalError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelWithdrawalDialog}>취소</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
