import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { authApi } from '@/api/auth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import { SecureKeypad } from '@/components/common/SecureKeypad';

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

const checkPasswordConditions = (password: string) => ({
  minLength: password.length >= 8,
  hasLetter: /[A-Za-z]/.test(password),
  hasNumber: /\d/.test(password),
  hasSpecial: /[@$!%*#?&]/.test(password),
});

/** 연속된 숫자 2개 이상 포함 여부 (오름/내림, 9↔0은 연속으로 보지 않음) */
const hasConsecutiveDigits = (pin: string): boolean => {
  for (let i = 0; i < pin.length - 1; i++) {
    const curr = parseInt(pin[i], 10);
    const next = parseInt(pin[i + 1], 10);
    const diff = Math.abs(curr - next);
    // diff === 1이면 연속 (예: 1→2, 5→4), 단 9↔0 (diff===9)은 제외
    if (diff === 1) return true;
  }
  return false;
};

const checkSecondaryPinConditions = (pin: string) => ({
  length: pin.length === 6,
  noConsecutive: pin.length >= 2 ? !hasConsecutiveDigits(pin) : true,
});

export const RegisterPage = () => {
  const { show } = useSnackbar();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const password = watch('password', '');
  const passwordConditions = checkPasswordConditions(password);

  /* ─── 2차 비밀번호 상태 ─── */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [secondaryPin, setSecondaryPin] = useState('');
  const [secondaryPinConfirm, setSecondaryPinConfirm] = useState('');
  const [pinStep, setPinStep] = useState<'input' | 'confirm'>('input');
  const [pinError, setPinError] = useState('');
  const [pinDone, setPinDone] = useState(false); // 설정 완료 여부

  const pinConditions = checkSecondaryPinConditions(secondaryPin);

  const openDialog = () => {
    // 리셋 후 열기
    setSecondaryPin('');
    setSecondaryPinConfirm('');
    setPinStep('input');
    setPinError('');
    setDialogOpen(true);
  };

  const handlePinChange = (val: string) => {
    setPinError('');
    if (pinStep === 'input') {
      setSecondaryPin(val);
    } else {
      setSecondaryPinConfirm(val);
    }
  };

  const handlePinNext = () => {
    if (secondaryPin.length !== 6) {
      setPinError('6자리를 모두 입력해주세요.');
      return;
    }
    if (hasConsecutiveDigits(secondaryPin)) {
      setPinError('연속된 숫자(예: 12, 89)를 포함할 수 없습니다.');
      return;
    }
    setPinStep('confirm');
    setSecondaryPinConfirm('');
    setPinError('');
  };

  const handlePinConfirm = () => {
    if (secondaryPinConfirm.length !== 6) {
      setPinError('확인용 6자리를 모두 입력해주세요.');
      return;
    }
    if (secondaryPin !== secondaryPinConfirm) {
      setPinError('2차 비밀번호가 일치하지 않습니다. 다시 입력해주세요.');
      setSecondaryPinConfirm('');
      return;
    }
    // 성공
    setPinDone(true);
    setDialogOpen(false);
  };

  const handlePinBack = () => {
    setPinStep('input');
    setSecondaryPinConfirm('');
    setPinError('');
  };

  const onSubmit = async (value: FormValues) => {
    if (!pinDone) {
      show('2차 비밀번호를 설정해주세요.', 'error');
      return;
    }

    try {
      await authApi.register({
        email: value.email,
        password: value.password,
        name: value.name,
        phone: value.phone || undefined,
        secondaryPin,
      });
      show('회원가입이 완료되었습니다. 로그인해주세요.', 'success');
      navigate('/login');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        '회원가입에 실패했습니다.';
      show(message, 'error');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: '#f5f7fb', py: 4 }}>
      <Card sx={{ width: 420 }}>
        <CardContent>
          <Link component={RouterLink} to="/" sx={{ textDecoration: 'none', color: '#d32f2f', fontWeight: 800, fontSize: '1.3rem', display: 'block', mb: 2 }}>
            MyCard
          </Link>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
            MyCard 회원가입
          </Typography>
          <Stack spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField label="이메일" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
            <TextField label="비밀번호" type="password" {...register('password')} error={!!errors.password} />

            {/* 비밀번호 조건 */}
            <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 1, p: 1.5, mt: -1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                비밀번호 조건
              </Typography>
              <List dense disablePadding sx={{ '& .MuiListItem-root': { py: 0 } }}>
                {([
                  ['minLength', '8자 이상'],
                  ['hasLetter', '영문 포함'],
                  ['hasNumber', '숫자 포함'],
                  ['hasSpecial', '특수문자 포함 (@$!%*#?&)'],
                ] as const).map(([key, label]) => (
                  <ListItem key={key} disableGutters>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      {passwordConditions[key] ?
                        <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} /> :
                        <CancelIcon sx={{ fontSize: 16, color: '#bdbdbd' }} />
                      }
                    </ListItemIcon>
                    <ListItemText
                      primary={label}
                      primaryTypographyProps={{
                        variant: 'caption',
                        color: passwordConditions[key] ? '#4caf50' : 'text.secondary',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <TextField
              label="비밀번호 확인"
              type="password"
              {...register('passwordConfirm')}
              error={!!errors.passwordConfirm}
              helperText={errors.passwordConfirm?.message}
            />

            {/* ─── 2차 비밀번호 트리거 (비밀번호 확인 바로 아래) ─── */}
            <Box
              sx={{
                border: '1px solid',
                borderColor: pinDone ? '#4caf50' : '#e0e0e0',
                borderRadius: 2,
                p: 2,
                bgcolor: pinDone ? '#f1f8e9' : '#fafbfc',
                transition: 'all 0.2s',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LockIcon sx={{ fontSize: 20, color: pinDone ? '#4caf50' : '#d32f2f' }} />
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      2차 비밀번호
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      금융거래 시 사용되는 6자리 숫자
                    </Typography>
                  </Box>
                </Box>
                {pinDone ? (
                  <Chip
                    label="설정 완료"
                    size="small"
                    color="success"
                    variant="outlined"
                    onDelete={() => {
                      setPinDone(false);
                      setSecondaryPin('');
                      setSecondaryPinConfirm('');
                    }}
                    sx={{ fontWeight: 600 }}
                  />
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={openDialog}
                    sx={{
                      bgcolor: '#d32f2f',
                      '&:hover': { bgcolor: '#b71c1c' },
                      fontSize: '0.8rem',
                      px: 2,
                    }}
                  >
                    설정하기
                  </Button>
                )}
              </Box>
            </Box>

            <TextField label="이름" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
            <TextField
              label="전화번호 (선택)"
              placeholder="010-1234-5678"
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || !pinDone}
              sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
            >
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

      {/* ─── 2차 비밀번호 팝업 (Dialog) ─── */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'visible' },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            borderBottom: '1px solid #eee',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon sx={{ color: '#d32f2f', fontSize: 22 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
              2차 비밀번호 설정
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setDialogOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5, pb: 3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, lineHeight: 1.6 }}>
            보안을 위해 아래 랜덤 키패드로 6자리 숫자를 입력해주세요.
            <br />
            연속된 숫자(예: 12, 89)는 사용할 수 없습니다.
          </Typography>

          {/* 조건 표시 */}
          <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 1, p: 1.2, mb: 2 }}>
            <List dense disablePadding sx={{ '& .MuiListItem-root': { py: 0 } }}>
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  {pinConditions.length ?
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} /> :
                    <CancelIcon sx={{ fontSize: 16, color: '#bdbdbd' }} />
                  }
                </ListItemIcon>
                <ListItemText primary="숫자 6자리" primaryTypographyProps={{ variant: 'caption', color: pinConditions.length ? '#4caf50' : 'text.secondary' }} />
              </ListItem>
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  {pinConditions.noConsecutive ?
                    <CheckCircleIcon sx={{ fontSize: 16, color: secondaryPin.length >= 2 ? '#4caf50' : '#bdbdbd' }} /> :
                    <CancelIcon sx={{ fontSize: 16, color: '#e53935' }} />
                  }
                </ListItemIcon>
                <ListItemText
                  primary="연속된 숫자 없음 (예: 12, 89 금지)"
                  primaryTypographyProps={{ variant: 'caption', color: pinConditions.noConsecutive ? (secondaryPin.length >= 2 ? '#4caf50' : 'text.secondary') : '#e53935' }}
                />
              </ListItem>
            </List>
          </Box>

          {/* 단계 표시 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 22, height: 22, borderRadius: '50%',
                  bgcolor: pinStep === 'input' ? '#d32f2f' : '#4caf50',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700,
                }}
              >
                {pinStep === 'input' ? '1' : '✓'}
              </Box>
              <Typography variant="caption" sx={{ fontWeight: pinStep === 'input' ? 700 : 400, color: pinStep === 'input' ? '#333' : '#999' }}>
                비밀번호 입력
              </Typography>
            </Box>
            <Box sx={{ width: 30, borderTop: '1px dashed #ccc', alignSelf: 'center' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 22, height: 22, borderRadius: '50%',
                  bgcolor: pinStep === 'confirm' ? '#d32f2f' : '#e0e0e0',
                  color: pinStep === 'confirm' ? '#fff' : '#999',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700,
                }}
              >
                2
              </Box>
              <Typography variant="caption" sx={{ fontWeight: pinStep === 'confirm' ? 700 : 400, color: pinStep === 'confirm' ? '#333' : '#999' }}>
                비밀번호 확인
              </Typography>
            </Box>
          </Box>

          {/* 에러 */}
          <Collapse in={!!pinError}>
            <Alert severity="error" sx={{ mb: 1.5, py: 0.2 }} onClose={() => setPinError('')}>
              <Typography variant="caption">{pinError}</Typography>
            </Alert>
          </Collapse>

          {/* 키패드 */}
          <SecureKeypad
            value={pinStep === 'input' ? secondaryPin : secondaryPinConfirm}
            onChange={handlePinChange}
            maxLength={6}
          />

          {/* 버튼 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
            {pinStep === 'confirm' && (
              <Button size="small" variant="outlined" onClick={handlePinBack} sx={{ fontSize: '0.8rem', borderColor: '#ccc', color: '#666' }}>
                다시 입력
              </Button>
            )}
            {pinStep === 'input' ? (
              <Button
                size="small"
                variant="contained"
                onClick={handlePinNext}
                disabled={!pinConditions.length || !pinConditions.noConsecutive}
                sx={{ fontSize: '0.8rem', bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' }, px: 3 }}
              >
                다음
              </Button>
            ) : (
              <Button
                size="small"
                variant="contained"
                onClick={handlePinConfirm}
                disabled={secondaryPinConfirm.length !== 6}
                sx={{ fontSize: '0.8rem', bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' }, px: 3 }}
              >
                설정 완료
              </Button>
            )}
          </Box>

          {/* 일치 여부 피드백 */}
          {pinStep === 'confirm' && secondaryPinConfirm.length === 6 && (
            <Alert
              severity={secondaryPin === secondaryPinConfirm ? 'success' : 'error'}
              sx={{ mt: 1.5, py: 0.2 }}
            >
              <Typography variant="caption">
                {secondaryPin === secondaryPinConfirm
                  ? '2차 비밀번호가 일치합니다. "설정 완료"를 눌러주세요.'
                  : '2차 비밀번호가 일치하지 않습니다.'}
              </Typography>
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
