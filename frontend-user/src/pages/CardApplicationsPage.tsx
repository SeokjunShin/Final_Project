import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { SecondAuthDialog } from '@/components/common/SecondAuthDialog';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useAuth } from '@/contexts/AuthContext';
import { bankAccountApi, cardApplicationApi, docsApi, type BankAccount } from '@/api';
import type { CardApplication, CardApplicationDocument, CardApplicationRequest } from '@/types';
import { maskName, maskPhone } from '@shared/masking';

const steps = ['개인정보', '직업/소득', '카드 선택', '계좌 연결'];

const statusMap: Record<string, { label: string; color: 'default' | 'info' | 'success' | 'error' }> = {
  PENDING: { label: '대기중', color: 'default' },
  REVIEWING: { label: '심사중', color: 'info' },
  APPROVED: { label: '승인', color: 'success' },
  REJECTED: { label: '거절', color: 'error' },
};

const employmentTypeOptions = [
  { value: 'EMPLOYED', label: '직장인' },
  { value: 'SELF_EMPLOYED', label: '자영업자' },
  { value: 'FREELANCER', label: '프리랜서' },
  { value: 'STUDENT', label: '학생' },
  { value: 'HOUSEWIFE', label: '주부' },
  { value: 'UNEMPLOYED', label: '무직' },
  { value: 'RETIRED', label: '은퇴' },
];

const cardTypeOptions = [
  { value: 'VISA', label: 'VISA' },
  { value: 'MASTERCARD', label: 'MASTERCARD' },
  { value: 'LOCAL', label: '국내전용' },
];

const cardProductOptions = [
  { value: 'Platinum', label: 'MyCard Platinum', description: '연회비 10만원, 프리미엄 혜택' },
  { value: 'Gold', label: 'MyCard Gold', description: '연회비 5만원, 포인트 적립 강화' },
  { value: 'Classic', label: 'MyCard Classic', description: '연회비 2만원, 기본 혜택' },
  { value: 'Check', label: 'MyCard Check', description: '연회비 무료, 체크형 상품' },
];

const evidenceDocTypeOptions = [
  { value: 'INCOME_PROOF', label: '소득증빙' },
  { value: 'ID_CARD', label: '신분증' },
  { value: 'RESIDENCE_PROOF', label: '주소증빙' },
  { value: 'EMPLOYMENT_PROOF', label: '재직증명' },
  { value: 'OTHER', label: '기타서류' },
];

const getDocTypeLabel = (docType: string) =>
  evidenceDocTypeOptions.find((item) => item.value === docType)?.label ?? docType;

const isSimpleCardPassword = (value: string) => {
  if (!/^\d{4,6}$/.test(value)) {
    return false;
  }

  if (/^(\d)\1+$/.test(value)) {
    return true;
  }

  const digits = value.split('').map(Number);
  const ascending = digits.every((digit, index) => index === 0 || digit === digits[index - 1] + 1);
  const descending = digits.every((digit, index) => index === 0 || digit === digits[index - 1] - 1);
  if (ascending || descending) {
    return true;
  }

  if (value.length % 2 === 0) {
    const pair = value.slice(0, 2);
    if (pair.repeat(value.length / 2) === value) {
      return true;
    }
  }

  return false;
};

const isValidKoreanName = (value: string) => /^[가-힣]{2,20}$/.test(value.trim());

const isValidKoreanMobile = (value: string) => /^01(?:0|1|[6-9])-\d{3,4}-\d{4}$/.test(value);

const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length < 11) return `${digits.slice(0, 3)}-${digits.slice(3, digits.length - 4)}-${digits.slice(-4)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
};

const formatSsn = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 6) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
};

const isValidKoreanSsn = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!/^\d{13}$/.test(digits)) return false;

  const front = digits.slice(0, 6);
  const backFirst = digits[6];
  if (!/^[1-4]$/.test(backFirst)) return false;

  const yearPrefix = backFirst === '1' || backFirst === '2' ? '19' : '20';
  const birthYear = Number(`${yearPrefix}${front.slice(0, 2)}`);
  const birthMonth = Number(front.slice(2, 4));
  const birthDay = Number(front.slice(4, 6));
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);

  if (
    birthDate.getFullYear() !== birthYear ||
    birthDate.getMonth() !== birthMonth - 1 ||
    birthDate.getDate() !== birthDay
  ) {
    return false;
  }

  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
  const sum = weights.reduce((acc, weight, index) => acc + Number(digits[index]) * weight, 0);
  const checkDigit = (11 - (sum % 11)) % 10;

  return checkDigit === Number(digits[12]);
};

export const CardApplicationsPage = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState<CardApplication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedApp, setSelectedApp] = useState<CardApplication | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [bankCodes, setBankCodes] = useState<Array<{ code: string; name: string }>>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [evidenceDocType, setEvidenceDocType] = useState('INCOME_PROOF');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [registeringAccount, setRegisteringAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    bankCode: '',
  });
  const { show } = useSnackbar();
  const { user } = useAuth();

  const initialFormData = (): CardApplicationRequest => ({
    fullName: '',
    ssn: '',
    phone: '',
    email: '',
    address: '',
    addressDetail: '',
    employmentType: 'EMPLOYED',
    employerName: '',
    jobTitle: '',
    annualIncome: '',
    cardType: 'VISA',
    cardProduct: 'Gold',
    requestedCreditLimit: 0,
    bankAccountId: undefined,
    agreedToPrivacyPolicy: false,
    privacyPolicyVersion: '2026-03',
    cardPassword: '',
  });

  const [formData, setFormData] = useState<CardApplicationRequest>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof CardApplicationRequest, string>>>({});

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await cardApplicationApi.list();
      setApplications(data);
    } catch (e) {
      console.error(e);
      show('카드 신청 내역을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBankData = async () => {
    try {
      setBankLoading(true);
      const [loadedAccounts, loadedCodes] = await Promise.all([
        bankAccountApi.list(),
        bankAccountApi.getBankCodes(),
      ]);
      setAccounts(loadedAccounts);
      setBankCodes(loadedCodes);
    } catch (e) {
      console.error(e);
      show('계좌 정보를 불러오지 못했습니다.', 'error');
    } finally {
      setBankLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleChange = (field: keyof CardApplicationRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    let value = e.target.value as string;

    if (field === 'phone') {
      value = formatPhoneNumber(value);
    }
    if (field === 'ssn') {
      value = formatSsn(value);
    }

    setFormData((prev) => ({ ...prev, [field]: value as never }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof CardApplicationRequest, string>> = {};

    if (step === 0) {
      if (!formData.fullName.trim()) newErrors.fullName = '이름을 입력해주세요';
      else if (!isValidKoreanName(formData.fullName)) newErrors.fullName = '이름은 한글 2~20자로 입력해주세요';
      if (!formData.ssn.trim()) newErrors.ssn = '주민등록번호를 입력해주세요';
      else if (!isValidKoreanSsn(formData.ssn)) newErrors.ssn = '유효한 주민등록번호를 입력해주세요';
      if (!formData.phone.trim()) newErrors.phone = '연락처를 입력해주세요';
      else if (!isValidKoreanMobile(formData.phone)) newErrors.phone = '휴대폰 번호는 010-0000-0000 형식으로 입력해주세요';
      if (!formData.email.trim()) newErrors.email = '이메일을 입력해주세요';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = '이메일 형식이 올바르지 않습니다';
      if (!formData.address.trim()) newErrors.address = '주소를 입력해주세요';
    }

    if (step === 1) {
      if (!formData.employmentType) newErrors.employmentType = '직업 유형을 선택해주세요';
      if (!formData.annualIncome.trim()) newErrors.annualIncome = '연소득을 입력해주세요';
    }

    if (step === 2) {
      if (!formData.cardType) newErrors.cardType = '카드 종류를 선택해주세요';
      if (!formData.cardProduct) newErrors.cardProduct = '카드 상품을 선택해주세요';
      if (!formData.cardPassword) newErrors.cardPassword = '카드 비밀번호를 입력해주세요';
      else if (!/^\d{4,6}$/.test(formData.cardPassword)) newErrors.cardPassword = '카드 비밀번호는 4~6자리 숫자여야 합니다';
      else if (isSimpleCardPassword(formData.cardPassword)) newErrors.cardPassword = '반복되거나 연속된 쉬운 비밀번호는 사용할 수 없습니다';
    }

    if (step === 3) {
      if (!formData.bankAccountId) newErrors.bankAccountId = '연결할 계좌를 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleStartApplication = async () => {
    await loadBankData();
    setIsAuthModalOpen(true);
  };

  const handleRegisterAccount = async () => {
    if (!newAccount.bankCode) {
      show('은행을 선택해주세요.', 'error');
      return;
    }
    try {
      setRegisteringAccount(true);
      const account = await bankAccountApi.add({
        ...newAccount,
        accountHolder: user?.name,
        setAsDefault: accounts.length === 0,
      });
      show(`${account.bankName} 계좌가 개설되었습니다.`, 'success');
      setAccounts((prev) => [account, ...prev]);
      setFormData((prev) => ({ ...prev, bankAccountId: account.id }));
      setNewAccount({ bankCode: '' });
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      show(error.response?.data?.message || '계좌 등록에 실패했습니다.', 'error');
    } finally {
      setRegisteringAccount(false);
    }
  };

  const submitApplication = async () => {
    try {
      setSubmitting(true);
      await cardApplicationApi.create({
        ...formData,
        agreedToPrivacyPolicy: true,
      });
      show('카드 신청이 접수되었습니다. 신청 상세에서 증빙 서류를 업로드할 수 있습니다.', 'success');
      setPrivacyDialogOpen(false);
      setPrivacyChecked(false);
      setShowForm(false);
      setActiveStep(0);
      setFormData(initialFormData());
      await loadApplications();
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      show(error.response?.data?.message || '신청 중 오류가 발생했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPrivacyDialog = () => {
    if (!validateStep(3)) return;
    setPrivacyDialogOpen(true);
  };

  const handleCancel = async (id: number) => {
    if (!confirm('정말로 신청을 취소하시겠습니까?')) return;

    try {
      await cardApplicationApi.cancel(id);
      show('신청이 취소되었습니다.', 'success');
      await loadApplications();
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      show(error.response?.data?.message || '취소 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleViewDetail = async (app: CardApplication) => {
    try {
      const detail = await cardApplicationApi.detail(app.id);
      setSelectedApp(detail);
      setDetailDialogOpen(true);
    } catch (e) {
      console.error(e);
      show('상세 정보를 불러오지 못했습니다.', 'error');
    }
  };

  const refreshSelectedApp = async (applicationId: number) => {
    const detail = await cardApplicationApi.detail(applicationId);
    setSelectedApp(detail);
    setApplications((prev) => prev.map((item) => (item.id === detail.id ? detail : item)));
  };

  const handleUploadEvidence = async () => {
    if (!selectedApp || !evidenceFile) return;
    try {
      setUploadingEvidence(true);
      const form = new FormData();
      form.append('file', evidenceFile);
      form.append('docType', evidenceDocType);
      await cardApplicationApi.uploadDocument(selectedApp.id, form);
      show('증빙 서류가 업로드되었습니다.', 'success');
      setEvidenceFile(null);
      await refreshSelectedApp(selectedApp.id);
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      show(error.response?.data?.message || '증빙 서류 업로드에 실패했습니다.', 'error');
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleDeleteEvidence = async (document: CardApplicationDocument) => {
    if (!selectedApp) return;
    if (!confirm('이 증빙 서류를 삭제하시겠습니까?')) return;

    try {
      await cardApplicationApi.deleteDocument(selectedApp.id, document.id);
      show('증빙 서류가 삭제되었습니다.', 'success');
      await refreshSelectedApp(selectedApp.id);
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      show(error.response?.data?.message || '증빙 서류 삭제에 실패했습니다.', 'error');
    }
  };

  const renderPersonalInfoStep = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Alert severity="info">신청 정보는 카드 발급 심사에 사용됩니다.</Alert>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth required label="이름" value={formData.fullName} onChange={handleChange('fullName')} error={!!errors.fullName} helperText={errors.fullName} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth required label="주민등록번호" placeholder="000000-0000000" value={formData.ssn} onChange={handleChange('ssn')} error={!!errors.ssn} helperText={errors.ssn} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth required label="휴대폰 번호" placeholder="010-0000-0000" value={formData.phone} onChange={handleChange('phone')} error={!!errors.phone} helperText={errors.phone} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth required label="이메일" type="email" value={formData.email} onChange={handleChange('email')} error={!!errors.email} helperText={errors.email} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth required label="주소" value={formData.address} onChange={handleChange('address')} error={!!errors.address} helperText={errors.address} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="상세주소" value={formData.addressDetail} onChange={handleChange('addressDetail')} />
      </Grid>
    </Grid>
  );

  const renderEmploymentStep = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required error={!!errors.employmentType}>
          <InputLabel>직업 유형</InputLabel>
          <Select value={formData.employmentType} label="직업 유형" onChange={(e) => setFormData((prev) => ({ ...prev, employmentType: e.target.value }))}>
            {employmentTypeOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
          {errors.employmentType && <FormHelperText>{errors.employmentType}</FormHelperText>}
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth label="직장명" value={formData.employerName} onChange={handleChange('employerName')} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth label="직책" value={formData.jobTitle} onChange={handleChange('jobTitle')} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="연소득"
          type="number"
          value={formData.annualIncome}
          onChange={handleChange('annualIncome')}
          error={!!errors.annualIncome}
          helperText={errors.annualIncome || '단위: 만원'}
          InputProps={{ endAdornment: <InputAdornment position="end">만원</InputAdornment> }}
        />
      </Grid>
    </Grid>
  );

  const renderCardSelectionStep = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required error={!!errors.cardType}>
          <InputLabel>카드 종류</InputLabel>
          <Select value={formData.cardType} label="카드 종류" onChange={(e) => setFormData((prev) => ({ ...prev, cardType: e.target.value }))}>
            {cardTypeOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
          {errors.cardType && <FormHelperText>{errors.cardType}</FormHelperText>}
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="희망 신용한도"
          type="number"
          value={formData.requestedCreditLimit}
          onChange={handleChange('requestedCreditLimit')}
          InputProps={{ endAdornment: <InputAdornment position="end">만원</InputAdornment> }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="카드 비밀번호"
          type="password"
          value={formData.cardPassword}
          onChange={handleChange('cardPassword')}
          error={!!errors.cardPassword}
          helperText={errors.cardPassword || '4~6자리 숫자'}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          카드 상품 선택
        </Typography>
        <Grid container spacing={2}>
          {cardProductOptions.map((product) => (
            <Grid item xs={12} sm={6} key={product.value}>
              <Card
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  border: formData.cardProduct === product.value ? '2px solid #d32f2f' : undefined,
                  bgcolor: formData.cardProduct === product.value ? 'rgba(211, 47, 47, 0.05)' : undefined,
                }}
                onClick={() => setFormData((prev) => ({ ...prev, cardProduct: product.value }))}
              >
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600}>{product.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{product.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );

  const renderAccountStep = () => (
    <Stack spacing={2}>
      <Alert severity="info">
        카드 결제계좌로 사용할 계좌를 연결해주세요. 신청 후 상세 화면에서 증빙 서류를 업로드할 수 있습니다.
      </Alert>

      <FormControl fullWidth error={!!errors.bankAccountId}>
        <InputLabel>연결 계좌</InputLabel>
        <Select
          value={formData.bankAccountId ?? ''}
          label="연결 계좌"
          onChange={(e) => setFormData((prev) => ({ ...prev, bankAccountId: Number(e.target.value) }))}
          disabled={bankLoading}
        >
          {accounts.map((account) => (
            <MenuItem key={account.id} value={account.id}>
              {account.bankName} / {account.accountNumberMasked} {account.isDefault ? '(기본)' : ''}
            </MenuItem>
          ))}
        </Select>
        {errors.bankAccountId && <FormHelperText>{errors.bankAccountId}</FormHelperText>}
      </FormControl>

      <Card variant="outlined" sx={{ bgcolor: '#fafafa' }}>
        <CardContent>
          <Typography sx={{ fontWeight: 700, mb: 1.5 }}>새 출금 계좌 즉시 개설</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>은행</InputLabel>
                <Select
                  value={newAccount.bankCode}
                  label="은행"
                  onChange={(e) => setNewAccount((prev) => ({ ...prev, bankCode: e.target.value }))}
                >
                  {bankCodes.map((code) => (
                    <MenuItem key={code.code} value={code.code}>{code.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="예금주"
                value={maskName(user?.name || formData.fullName || '')}
                helperText="회원 본인 명의로 자동 개설됩니다."
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="계좌번호"
                value="개설 완료 시 자동 생성"
                helperText="개설 후 즉시 인증 완료되며, 선택 목록에 새 계좌가 자동 반영됩니다."
                disabled
              />
            </Grid>
          </Grid>
        <Alert severity="success" sx={{ mt: 2 }}>
            개설이 완료되면 새 계좌가 선택 목록에 자동으로 반영됩니다.
          </Alert>
          <Box sx={{ mt: 1.5 }}>
            <Button variant="outlined" onClick={handleRegisterAccount} disabled={registeringAccount}>
              {registeringAccount ? '개설 중...' : '계좌 개설'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderPersonalInfoStep();
      case 1:
        return renderEmploymentStep();
      case 2:
        return renderCardSelectionStep();
      case 3:
        return renderAccountStep();
      default:
        return null;
    }
  };

  const renderDocumentSection = (app: CardApplication) => (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">증빙 서류</Typography>
      {(app.evidenceDocuments?.length ?? 0) === 0 ? (
        <Typography variant="body2" color="text.secondary">
          업로드된 증빙 서류가 없습니다.
        </Typography>
      ) : (
        <List dense>
          {(app.evidenceDocuments ?? []).map((document) => (
            <ListItem
              key={document.id}
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  {document.fileName && (
                    <Button size="small" onClick={() => docsApi.download(document.id, document.fileName ?? 'evidence')}>
                      다운로드
                    </Button>
                  )}
                  {app.status !== 'APPROVED' && (
                    <Button size="small" color="error" onClick={() => handleDeleteEvidence(document)}>
                      삭제
                    </Button>
                  )}
                </Stack>
              }
            >
              <ListItemText
                primary={`${getDocTypeLabel(document.docType)}${document.fileName ? ` / ${document.fileName}` : ''}`}
                secondary={`${document.status} · ${new Date(document.submittedAt).toLocaleString('ko-KR')}${document.rejectionReason ? ` · ${document.rejectionReason}` : ''}`}
              />
            </ListItem>
          ))}
        </List>
      )}

      {app.status !== 'APPROVED' && (
        <Card variant="outlined">
          <CardContent>
            <Typography sx={{ fontWeight: 700, mb: 1.5 }}>증빙 서류 업로드</Typography>
            <Stack spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>서류 유형</InputLabel>
                <Select value={evidenceDocType} label="서류 유형" onChange={(e) => setEvidenceDocType(e.target.value)}>
                  {evidenceDocTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button component="label" variant="outlined">
                {evidenceFile ? evidenceFile.name : '파일 선택'}
                <input hidden type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)} />
              </Button>
              <Box>
                <Button variant="contained" disabled={uploadingEvidence || !evidenceFile} onClick={handleUploadEvidence}>
                  {uploadingEvidence ? '업로드 중...' : '증빙 업로드'}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  const renderApplicationList = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">내 카드 신청 내역</Typography>
        <Button variant="contained" onClick={handleStartApplication}>새 카드 신청</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              카드 신청 내역이 없습니다.
            </Typography>
            <Button variant="contained" onClick={handleStartApplication}>
              첫 카드 신청하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {app.cardProduct} ({app.cardType})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      신청일: {new Date(app.createdAt).toLocaleDateString('ko-KR')}
                    </Typography>
                    {app.linkedBankName && (
                      <Typography variant="body2" color="text.secondary">
                        연결 계좌: {app.linkedBankName} / {app.linkedAccountNumberMasked}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      증빙 서류: {app.evidenceDocuments?.length ?? 0}건
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip label={statusMap[app.status]?.label || app.status} color={statusMap[app.status]?.color || 'default'} size="small" />
                    {app.status === 'APPROVED' && app.retentionUntil && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        보관 만료: {new Date(app.retentionUntil).toLocaleDateString('ko-KR')}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button size="small" onClick={() => handleViewDetail(app)}>상세보기</Button>
                  {app.status === 'PENDING' && (
                    <Button size="small" color="error" onClick={() => handleCancel(app.id)}>취소</Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );

  const renderApplicationForm = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button onClick={() => setShowForm(false)} sx={{ mr: 2 }}>← 목록으로</Button>
        <Typography variant="h6">새 카드 신청</Typography>
      </Box>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>이전</Button>
            {activeStep === steps.length - 1 ? (
              <Button variant="contained" onClick={handleOpenPrivacyDialog}>
                신청 정보 확인
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>다음</Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box>
      <SecondAuthDialog
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          setShowForm(true);
        }}
      />

      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        카드 신청 / 발급
      </Typography>

      {showForm ? renderApplicationForm() : renderApplicationList()}

      <Dialog open={privacyDialogOpen} onClose={() => setPrivacyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>개인정보 처리 방침 동의</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Alert severity="info">[초안] MyCard 개인정보처리방침</Alert>
            <Typography variant="body2" color="text.secondary">
              MyCard(이하 "회사")는 이용자의 개인정보를 소중히 다루며, 관련 법령에 따라 아래와 같은 처리방침을 수립하여 운영하고 있습니다.
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              1. 개인정보의 처리 목적
            </Typography>
            <Typography variant="body2" color="text.secondary">
              회사는 다음의 목적을 위해 최소한의 개인정보를 처리합니다.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              회원 가입 및 관리: 본인 식별, 가입 의사 확인, 부정이용 방지.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              카드 서비스 제공: 카드 발급 및 배송, 대금 결제 및 정산, 금융거래 본인인증.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              고객 상담 및 민원 처리: 서비스 이용 관련 문의 대응 및 고지사항 전달.
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              2. 처리하는 개인정보 항목
            </Typography>
            <Typography variant="body2" color="text.secondary">
              카드 서비스 특성상 일반 정보뿐만 아니라 고유식별정보와 신용정보가 포함됩니다.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              필수 항목: 성명, 생년월일, 성별, 휴대전화번호, 주소, 이메일, 계좌번호.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              고유식별정보: 주민등록번호, 외국인등록번호 (카드 발급 및 금융거래 목적).
            </Typography>
            <Typography variant="body2" color="text.secondary">
              자동 수집 항목: IP주소, 쿠키, 서비스 이용 기록, 기기 정보.
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              3. 개인정보의 보유 및 이용 기간
            </Typography>
            <Typography variant="body2" color="text.secondary">
              원칙: 서비스 탈퇴 시 또는 수집 목적 달성 시 지체 없이 파기합니다.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              법령에 따른 보존: 상법 및 전자상거래법 등 관련 법령에 따라 일정 기간 보관합니다.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              계약 또는 청약철회 등에 관한 기록: 5년
            </Typography>
            <Typography variant="body2" color="text.secondary">
              대금결제 및 재화 등의 공급에 관한 기록: 5년
            </Typography>
            <Typography variant="body2" color="text.secondary">
              소비자의 불만 또는 분쟁처리에 관한 기록: 3년
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              4. 개인정보의 파기 절차 및 방법
            </Typography>
            <Typography variant="body2" color="text.secondary">
              절차: 목적 달성 후 별도의 DB로 옮겨져 일정 기간 보관 후 파기됩니다.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              방법: 전자적 파일은 복구가 불가능한 기술적 방법으로 삭제하며, 종이 문서는 분쇄하거나 소각합니다.
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              5. 개인정보의 안전성 확보 조치
            </Typography>
            <Typography variant="body2" color="text.secondary">
              MyCard는 보안을 위해 다음과 같은 조치를 취하고 있습니다.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              암호화: 비밀번호와 고유식별정보는 안전한 알고리즘으로 암호화하여 저장합니다.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              접근 제한: 개인정보처리시스템에 대한 접근 권한을 최소화하고 정기적으로 점검합니다.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              해킹 대비: 침입차단시스템 및 보안 프로그램을 설치하여 외부로부터의 무단 접근을 통제합니다.
            </Typography>
            <Button
              variant={privacyChecked ? 'contained' : 'outlined'}
              onClick={() => setPrivacyChecked((prev) => !prev)}
            >
              {privacyChecked ? '동의 완료' : '개인정보 처리 방침에 동의합니다'}
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrivacyDialogOpen(false)} disabled={submitting}>취소</Button>
          <Button variant="contained" disabled={!privacyChecked || submitting} onClick={submitApplication}>
            {submitting ? '신청 중...' : '카드 신청하기'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>신청 상세 정보</DialogTitle>
        <DialogContent dividers>
          {selectedApp && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemText primary="카드 상품" secondary={`${selectedApp.cardProduct} (${selectedApp.cardType})`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="신청자 정보" secondary={`${maskName(selectedApp.fullName)} / ${selectedApp.maskedSsn}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="연락처" secondary={maskPhone(selectedApp.phone)} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="이메일" secondary={selectedApp.email} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="주소" secondary={`${selectedApp.address} ${selectedApp.addressDetail || ''}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="연결 계좌" secondary={selectedApp.linkedBankName ? `${selectedApp.linkedBankName} / ${selectedApp.linkedAccountNumberMasked}` : '미연결'} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="개인정보 처리방침 동의" secondary={selectedApp.privacyConsentedAt ? `동의 (${new Date(selectedApp.privacyConsentedAt).toLocaleString('ko-KR')})` : '미동의'} />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemText primary="상태" secondary={<Chip label={statusMap[selectedApp.status]?.label || selectedApp.status} color={statusMap[selectedApp.status]?.color || 'default'} size="small" />} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="신청일" secondary={new Date(selectedApp.createdAt).toLocaleString('ko-KR')} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="희망 한도" secondary={selectedApp.requestedCreditLimit ? `${selectedApp.requestedCreditLimit.toLocaleString()}만원` : '없음'} />
                  </ListItem>
                  {selectedApp.approvedCreditLimit && (
                    <ListItem>
                      <ListItemText primary="승인 한도" secondary={`${selectedApp.approvedCreditLimit.toLocaleString()}만원`} />
                    </ListItem>
                  )}
                  {selectedApp.retentionUntil && (
                    <ListItem>
                      <ListItemText primary="보관 만료일" secondary={new Date(selectedApp.retentionUntil).toLocaleDateString('ko-KR')} />
                    </ListItem>
                  )}
                  {selectedApp.rejectionReason && (
                    <ListItem>
                      <ListItemText primary="거절 사유" secondary={selectedApp.rejectionReason} />
                    </ListItem>
                  )}
                  {selectedApp.issuedCardNumber && (
                    <ListItem>
                      <ListItemText primary="발급 카드번호" secondary={selectedApp.issuedCardNumber} />
                    </ListItem>
                  )}
                </List>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ mb: 2 }} />
                {renderDocumentSection(selectedApp)}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
