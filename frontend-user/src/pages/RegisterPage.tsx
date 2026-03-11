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
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
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

/** 동일한 숫자 3개 이상 반복 여부 (예: 111, 222) */
const hasSameDigits = (pin: string): boolean => {
  return /(\d)\1\1/.test(pin);
};

const checkSecondaryPinConditions = (pin: string) => ({
  length: pin.length === 6,
  noConsecutive: pin.length >= 2 ? !hasConsecutiveDigits(pin) : true,
  noSame: pin.length >= 3 ? !hasSameDigits(pin) : true,
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

  /* ─── 이메일 중복확인 상태 ─── */
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<'available' | 'duplicate' | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [checkedEmail, setCheckedEmail] = useState(''); // 중복확인 완료된 이메일

  /* ─── 보안 질문 상태 ─── */
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  /* ─── 약관 동의 상태 ─── */
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  /* ─── 2차 비밀번호 상태 ─── */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [secondaryPin, setSecondaryPin] = useState('');
  const [secondaryPinConfirm, setSecondaryPinConfirm] = useState('');
  const [pinStep, setPinStep] = useState<'input' | 'confirm'>('input');
  const [pinError, setPinError] = useState('');
  const [pinDone, setPinDone] = useState(false); // 설정 완료 여부

  const pinConditions = checkSecondaryPinConditions(secondaryPin);

  const currentEmail = watch('email', '');

  const handleCheckEmail = async () => {
    if (!currentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail)) {
      show('유효한 이메일을 입력해주세요.', 'error');
      return;
    }
    setEmailChecking(true);
    try {
      const result = await authApi.checkEmail(currentEmail);
      if (result.exists) {
        setEmailCheckResult('duplicate');
        setEmailChecked(false);
      } else {
        setEmailCheckResult('available');
        setEmailChecked(true);
        setCheckedEmail(currentEmail);
      }
    } catch {
      show('이메일 확인에 실패했습니다.', 'error');
    } finally {
      setEmailChecking(false);
    }
  };

  // 이메일이 변경되면 중복확인 초기화
  const handleEmailChange = () => {
    if (emailChecked && currentEmail !== checkedEmail) {
      setEmailChecked(false);
      setEmailCheckResult(null);
    }
  };

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
    if (hasSameDigits(secondaryPin)) {
      setPinError('동일한 숫자 반복(예: 111)은 사용할 수 없습니다.');
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
    if (!emailChecked || value.email !== checkedEmail) {
      show('이메일 중복확인을 해주세요.', 'error');
      return;
    }
    if (!pinDone) {
      show('2차 비밀번호를 설정해주세요.', 'error');
      return;
    }
    if (!securityQuestion || !securityAnswer.trim()) {
      show('보안 질문을 선택하고 답변을 입력해주세요.', 'error');
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      show('이용약관 및 개인정보처리방침에 동의해주세요.', 'error');
      return;
    }

    try {
      await authApi.register({
        email: value.email,
        password: value.password,
        name: value.name,
        phone: value.phone || undefined,
        secondaryPin,
        securityQuestion,
        securityAnswer: securityAnswer.trim(),
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
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                label="이메일"
                {...register('email', {
                  onChange: handleEmailChange,
                })}
                error={!!errors.email}
                helperText={
                  errors.email?.message ||
                  (emailCheckResult === 'available' ? '✓ 사용 가능한 이메일입니다.' : '') ||
                  (emailCheckResult === 'duplicate' ? '✗ 이미 사용 중인 이메일입니다.' : '')
                }
                sx={{ flex: 1 }}
                FormHelperTextProps={{
                  sx: {
                    color: emailCheckResult === 'available' ? '#4caf50' : emailCheckResult === 'duplicate' ? '#d32f2f' : undefined,
                  },
                }}
              />
              <Button
                variant="outlined"
                onClick={handleCheckEmail}
                disabled={emailChecking || !currentEmail}
                sx={{
                  minWidth: 80,
                  height: 56,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderColor: emailChecked ? '#4caf50' : '#d32f2f',
                  color: emailChecked ? '#4caf50' : '#d32f2f',
                  '&:hover': {
                    borderColor: emailChecked ? '#388e3c' : '#b71c1c',
                    bgcolor: emailChecked ? '#f1f8e9' : '#fff5f5',
                  },
                  whiteSpace: 'nowrap',
                }}
              >
                {emailChecking ? '확인중...' : emailChecked ? '확인완료' : '중복확인'}
              </Button>
            </Box>
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

            {/* ─── 보안 질문 ─── */}
            <Box
              sx={{
                border: '1px solid',
                borderColor: securityQuestion && securityAnswer.trim() ? '#4caf50' : '#e0e0e0',
                borderRadius: 2,
                p: 2,
                bgcolor: securityQuestion && securityAnswer.trim() ? '#f1f8e9' : '#fafbfc',
                transition: 'all 0.2s',
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 1.5 }}>
                🔐 보안 질문 (비밀번호 분실 시 본인 확인)
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                <InputLabel>보안 질문 선택</InputLabel>
                <Select
                  value={securityQuestion}
                  label="보안 질문 선택"
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                >
                  <MenuItem value="내가 다녔던 초등학교 이름은?">내가 다녔던 초등학교 이름은?</MenuItem>
                  <MenuItem value="어머니의 성함은?">어머니의 성함은?</MenuItem>
                  <MenuItem value="첫 번째 반려동물의 이름은?">첫 번째 반려동물의 이름은?</MenuItem>
                  <MenuItem value="내가 태어난 도시 이름은?">내가 태어난 도시 이름은?</MenuItem>
                  <MenuItem value="좋아하는 음식은?">좋아하는 음식은?</MenuItem>
                  <MenuItem value="가장 친한 친구의 이름은?">가장 친한 친구의 이름은?</MenuItem>
                  <MenuItem value="첫 직장의 이름은?">첫 직장의 이름은?</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="보안 답변"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                fullWidth
                size="small"
                placeholder="답변은 대소문자 구분 없이 저장됩니다"
                helperText="비밀번호 분실 시 본인 확인에 사용됩니다."
              />
            </Box>

            {/* ─── 약관 동의 ─── */}
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2, bgcolor: '#fafbfc' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 1 }}>약관 동의</Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreeTerms && agreePrivacy}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      setAgreePrivacy(e.target.checked);
                    }}
                    sx={{ color: '#d32f2f', '&.Mui-checked': { color: '#d32f2f' } }}
                  />
                }
                label={<Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>전체 동의</Typography>}
              />
              <Box sx={{ borderTop: '1px solid #eee', mt: 0.5, pt: 0.5, pl: 1 }}>
                {/* 이용약관 */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        size="small"
                        sx={{ color: '#999', '&.Mui-checked': { color: '#d32f2f' } }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: '#555' }}>
                        [필수] 이용약관 동의
                      </Typography>
                    }
                  />
                  <Typography
                    variant="caption"
                    onClick={() => setShowTerms(!showTerms)}
                    sx={{ color: '#888', cursor: 'pointer', textDecoration: 'underline', '&:hover': { color: '#d32f2f' }, mr: 1 }}
                  >
                    {showTerms ? '접기' : '보기'}
                  </Typography>
                </Box>
                <Collapse in={showTerms}>
                  <Box sx={{ bgcolor: '#fff', border: '1px solid #eee', borderRadius: 1, p: 1.5, ml: 3.5, mb: 1.5, maxHeight: 150, overflowY: 'auto', fontSize: '0.75rem', color: '#666', lineHeight: 1.7 }}>
                    <b>제1조 (목적)</b><br />
                    이 약관은 MyCard(이하 "회사")가 제공하는 카드 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.<br /><br />
                    <b>제2조 (용어의 정의)</b><br />
                    ① "서비스"란 회사가 제공하는 카드 발급, 포인트 적립·사용, e쿠폰 교환 등 제반 서비스를 말합니다.<br />
                    ② "회원"이란 이 약관에 동의하고 회원가입을 완료한 자를 말합니다.<br />
                    ③ "포인트"란 서비스 이용 과정에서 적립되는 가상의 보상 단위를 말합니다.<br /><br />
                    <b>제3조 (약관의 효력 및 변경)</b><br />
                    ① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.<br />
                    ② 회사는 관련 법령에 위배되지 않는 범위에서 이 약관을 변경할 수 있으며, 변경 시 7일 전 공지합니다.<br /><br />
                    <b>제4조 (서비스의 제공)</b><br />
                    회사는 다음의 서비스를 제공합니다: 카드 신청 및 관리, 결제 내역 조회, 포인트 적립 및 사용, e쿠폰 교환, 대출 신청 등.<br /><br />
                    <b>제5조 (회원의 의무)</b><br />
                    ① 회원은 관계 법령, 이 약관, 이용안내 등을 준수하여야 합니다.<br />
                    ② 회원은 타인의 개인정보를 도용하여 서비스를 이용할 수 없습니다.<br />
                    ③ 회원은 2차 비밀번호 등 인증정보를 안전하게 관리할 책임이 있습니다.
                  </Box>
                </Collapse>

                {/* 개인정보처리방침 */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={agreePrivacy}
                        onChange={(e) => setAgreePrivacy(e.target.checked)}
                        size="small"
                        sx={{ color: '#999', '&.Mui-checked': { color: '#d32f2f' } }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: '#555' }}>
                        [필수] 개인정보처리방침 동의
                      </Typography>
                    }
                  />
                  <Typography
                    variant="caption"
                    onClick={() => setShowPrivacy(!showPrivacy)}
                    sx={{ color: '#888', cursor: 'pointer', textDecoration: 'underline', '&:hover': { color: '#d32f2f' }, mr: 1 }}
                  >
                    {showPrivacy ? '접기' : '보기'}
                  </Typography>
                </Box>
                <Collapse in={showPrivacy}>
                  <Box sx={{ bgcolor: '#fff', border: '1px solid #eee', borderRadius: 1, p: 1.5, ml: 3.5, mb: 1, maxHeight: 150, overflowY: 'auto', fontSize: '0.75rem', color: '#666', lineHeight: 1.7 }}>
                    <b>1. 수집하는 개인정보 항목</b><br />
                    회사는 회원가입 및 서비스 제공을 위해 다음 정보를 수집합니다.<br />
                    · 필수항목: 이메일, 비밀번호, 이름<br />
                    · 선택항목: 전화번호<br />
                    · 자동수집: 접속 IP, 서비스 이용기록, 방문기록<br /><br />
                    <b>2. 개인정보의 수집 및 이용목적</b><br />
                    · 회원 식별 및 가입 의사 확인<br />
                    · 카드 서비스 제공 및 관리<br />
                    · 포인트 적립·사용 및 e쿠폰 발급<br />
                    · 고객 문의 및 불만 처리<br />
                    · 서비스 개선 및 신규 서비스 개발<br /><br />
                    <b>3. 개인정보의 보유 및 이용기간</b><br />
                    회원 탈퇴 시까지 보유하며, 관계 법령에 따라 일정 기간 보존이 필요한 경우 해당 기간 동안 보관합니다.<br />
                    · 계약 및 청약철회에 관한 기록: 5년<br />
                    · 대금결제 및 재화 등의 공급에 관한 기록: 5년<br />
                    · 소비자의 불만 또는 분쟁처리에 관한 기록: 3년<br /><br />
                    <b>4. 개인정보의 제3자 제공</b><br />
                    회사는 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다. 다만, 법령의 규정에 의거하거나 회원의 동의가 있는 경우에 한하여 제공할 수 있습니다.<br /><br />
                    <b>5. 개인정보의 파기</b><br />
                    보유기간이 경과하거나 처리목적이 달성된 경우 지체 없이 파기합니다.
                  </Box>
                </Collapse>
              </Box>
            </Box>

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || !pinDone || !emailChecked || !agreeTerms || !agreePrivacy}
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
            연속된 숫자(예: 12) 및 동일 숫자 반복(예: 111)은 불가합니다.
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
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  {pinConditions.noSame ?
                    <CheckCircleIcon sx={{ fontSize: 16, color: secondaryPin.length >= 3 ? '#4caf50' : '#bdbdbd' }} /> :
                    <CancelIcon sx={{ fontSize: 16, color: '#e53935' }} />
                  }
                </ListItemIcon>
                <ListItemText
                  primary="동일한 숫자 반복 없음 (예: 111 금지)"
                  primaryTypographyProps={{ variant: 'caption', color: pinConditions.noSame ? (secondaryPin.length >= 3 ? '#4caf50' : 'text.secondary') : '#e53935' }}
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
