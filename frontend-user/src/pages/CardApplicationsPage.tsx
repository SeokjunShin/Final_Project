import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { cardApplicationApi } from '@/api';
import type { CardApplication, CardApplicationRequest } from '@/types';

const steps = ['개인정보 입력', '직업/소득 정보', '카드 선택', '신청 완료'];

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
  { value: 'Platinum', label: 'MyCard Platinum', description: '연회비 10만원, VIP 혜택 제공' },
  { value: 'Gold', label: 'MyCard Gold', description: '연회비 5만원, 포인트 적립 강화' },
  { value: 'Classic', label: 'MyCard Classic', description: '연회비 2만원, 기본 혜택' },
  { value: 'Check', label: 'MyCard Check', description: '연회비 무료, 체크카드' },
];

export const CardApplicationsPage = () => {
  const { show } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState<CardApplication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedApp, setSelectedApp] = useState<CardApplication | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState<CardApplicationRequest>({
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
    cardPassword: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CardApplicationRequest, string>>>({});

  // 신청 목록 로드
  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await cardApplicationApi.list();
      setApplications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // 입력값 변경
  const handleChange = (field: keyof CardApplicationRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // 유효성 검사
  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof CardApplicationRequest, string>> = {};

    if (step === 0) {
      if (!formData.fullName.trim()) newErrors.fullName = '이름을 입력해주세요';
      if (!formData.ssn.trim()) newErrors.ssn = '주민등록번호를 입력해주세요';
      else if (!/^\d{6}-?\d{7}$/.test(formData.ssn.replace(/-/g, ''))) 
        newErrors.ssn = '주민등록번호 형식이 올바르지 않습니다 (예: 900101-1234567)';
      if (!formData.phone.trim()) newErrors.phone = '연락처를 입력해주세요';
      else if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(formData.phone.replace(/-/g, '')))
        newErrors.phone = '휴대폰 번호 형식이 올바르지 않습니다';
      if (!formData.email.trim()) newErrors.email = '이메일을 입력해주세요';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = '이메일 형식이 올바르지 않습니다';
      if (!formData.address.trim()) newErrors.address = '주소를 입력해주세요';
    }

    if (step === 1) {
      if (!formData.employmentType) newErrors.employmentType = '직업 유형을 선택해주세요';
      if (!formData.annualIncome.trim()) newErrors.annualIncome = '연소득을 입력해주세요';
      else if (isNaN(Number(formData.annualIncome)) || Number(formData.annualIncome) < 0)
        newErrors.annualIncome = '유효한 금액을 입력해주세요';
    }

    if (step === 2) {
      if (!formData.cardType) newErrors.cardType = '카드 종류를 선택해주세요';
      if (!formData.cardProduct) newErrors.cardProduct = '카드 상품을 선택해주세요';
      if (!formData.cardPassword) newErrors.cardPassword = '카드 비밀번호를 입력해주세요';
      else if (!/^\d{4,6}$/.test(formData.cardPassword))
        newErrors.cardPassword = '카드 비밀번호는 4~6자리 숫자여야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 다음 단계
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  // 이전 단계
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // 신청 제출
  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    try {
      setSubmitting(true);
      await cardApplicationApi.create(formData);
      show('카드 신청이 접수되었습니다. 심사 결과는 별도로 안내드립니다.', 'success');
      setShowForm(false);
      setActiveStep(3);
      loadApplications();
      // 폼 초기화
      setFormData({
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
        cardPassword: '',
      });
      setActiveStep(0);
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      show(error.response?.data?.message || '신청 중 오류가 발생했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 신청 취소
  const handleCancel = async (id: number) => {
    if (!confirm('정말로 신청을 취소하시겠습니까?')) return;

    try {
      await cardApplicationApi.cancel(id);
      show('신청이 취소되었습니다.', 'success');
      loadApplications();
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      show(error.response?.data?.message || '취소 중 오류가 발생했습니다.', 'error');
    }
  };

  // 상세 보기
  const handleViewDetail = async (app: CardApplication) => {
    try {
      const detail = await cardApplicationApi.detail(app.id);
      setSelectedApp(detail);
      setDetailDialogOpen(true);
    } catch {
      setSelectedApp(app);
      setDetailDialogOpen(true);
    }
  };

  // 개인정보 입력 폼
  const renderPersonalInfoStep = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 2 }}>
          입력하신 개인정보는 암호화되어 안전하게 보관됩니다.
        </Alert>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="이름"
          value={formData.fullName}
          onChange={handleChange('fullName')}
          error={!!errors.fullName}
          helperText={errors.fullName}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="주민등록번호"
          placeholder="000000-0000000"
          value={formData.ssn}
          onChange={handleChange('ssn')}
          error={!!errors.ssn}
          helperText={errors.ssn || '형식: 900101-1234567'}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="휴대폰 번호"
          placeholder="010-0000-0000"
          value={formData.phone}
          onChange={handleChange('phone')}
          error={!!errors.phone}
          helperText={errors.phone}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="이메일"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          error={!!errors.email}
          helperText={errors.email}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="주소"
          value={formData.address}
          onChange={handleChange('address')}
          error={!!errors.address}
          helperText={errors.address}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="상세주소"
          value={formData.addressDetail}
          onChange={handleChange('addressDetail')}
        />
      </Grid>
    </Grid>
  );

  // 직업/소득 정보 폼
  const renderEmploymentStep = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required error={!!errors.employmentType}>
          <InputLabel>직업 유형</InputLabel>
          <Select
            value={formData.employmentType}
            label="직업 유형"
            onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
          >
            {employmentTypeOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          {errors.employmentType && <FormHelperText>{errors.employmentType}</FormHelperText>}
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="직장명"
          value={formData.employerName}
          onChange={handleChange('employerName')}
          disabled={!['EMPLOYED', 'SELF_EMPLOYED'].includes(formData.employmentType)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="직업/직책"
          value={formData.jobTitle}
          onChange={handleChange('jobTitle')}
        />
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
          helperText={errors.annualIncome || '세전 연소득을 입력해주세요'}
          InputProps={{
            endAdornment: <InputAdornment position="end">만원</InputAdornment>,
          }}
        />
      </Grid>
    </Grid>
  );

  // 카드 선택 폼
  const renderCardSelectionStep = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required error={!!errors.cardType}>
          <InputLabel>카드 종류</InputLabel>
          <Select
            value={formData.cardType}
            label="카드 종류"
            onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
          >
            {cardTypeOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
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
          InputProps={{
            endAdornment: <InputAdornment position="end">만원</InputAdornment>,
          }}
          helperText="실제 한도는 심사 결과에 따라 달라질 수 있습니다"
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
          helperText={errors.cardPassword || '4~6자리 숫자를 입력해주세요'}
          inputProps={{ maxLength: 6 }}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
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
                onClick={() => setFormData({ ...formData, cardProduct: product.value })}
              >
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {product.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );

  // 스텝별 컨텐츠
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderPersonalInfoStep();
      case 1:
        return renderEmploymentStep();
      case 2:
        return renderCardSelectionStep();
      default:
        return null;
    }
  };

  // 신청 목록
  const renderApplicationList = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">내 카드 신청 내역</Typography>
        <Button variant="contained" onClick={() => setShowForm(true)}>
          새 카드 신청
        </Button>
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
            <Button variant="contained" onClick={() => setShowForm(true)}>
              첫 카드 신청하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {app.cardProduct} ({app.cardType})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      신청일: {new Date(app.createdAt).toLocaleDateString('ko-KR')}
                    </Typography>
                    {app.requestedCreditLimit && (
                      <Typography variant="body2" color="text.secondary">
                        희망한도: {app.requestedCreditLimit.toLocaleString()}만원
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label={statusMap[app.status]?.label || app.status}
                      color={statusMap[app.status]?.color || 'default'}
                      size="small"
                    />
                    {app.status === 'APPROVED' && app.approvedCreditLimit && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        승인한도: {app.approvedCreditLimit.toLocaleString()}만원
                      </Typography>
                    )}
                    {app.status === 'REJECTED' && app.rejectionReason && (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        사유: {app.rejectionReason}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button size="small" onClick={() => handleViewDetail(app)}>
                    상세보기
                  </Button>
                  {app.status === 'PENDING' && (
                    <Button size="small" color="error" onClick={() => handleCancel(app.id)}>
                      취소
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );

  // 신청 폼
  const renderApplicationForm = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button onClick={() => setShowForm(false)} sx={{ mr: 2 }}>
          ← 목록으로
        </Button>
        <Typography variant="h6">새 카드 신청</Typography>
      </Box>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.slice(0, 3).map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              이전
            </Button>
            {activeStep === 2 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : '신청하기'}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                다음
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        카드 신청 / 발급
      </Typography>

      {showForm ? renderApplicationForm() : renderApplicationList()}

      {/* 상세 보기 다이얼로그 */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>신청 상세 정보</DialogTitle>
        <DialogContent dividers>
          {selectedApp && (
            <List dense>
              <ListItem>
                <ListItemText primary="카드 상품" secondary={`${selectedApp.cardProduct} (${selectedApp.cardType})`} />
              </ListItem>
              <ListItem>
                <ListItemText primary="신청자 정보" secondary={`${selectedApp.fullName} / ${selectedApp.maskedSsn}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary="연락처" secondary={selectedApp.phone} />
              </ListItem>
              <ListItem>
                <ListItemText primary="이메일" secondary={selectedApp.email} />
              </ListItem>
              <ListItem>
                <ListItemText primary="주소" secondary={`${selectedApp.address} ${selectedApp.addressDetail || ''}`} />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="직업"
                  secondary={`${employmentTypeOptions.find((e) => e.value === selectedApp.employmentType)?.label || selectedApp.employmentType}${selectedApp.employerName ? ` - ${selectedApp.employerName}` : ''}`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="희망 한도"
                  secondary={selectedApp.requestedCreditLimit ? `${selectedApp.requestedCreditLimit.toLocaleString()}만원` : '없음'}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="신청 상태"
                  secondary={
                    <Chip
                      label={statusMap[selectedApp.status]?.label || selectedApp.status}
                      color={statusMap[selectedApp.status]?.color || 'default'}
                      size="small"
                    />
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText primary="신청일" secondary={new Date(selectedApp.createdAt).toLocaleString('ko-KR')} />
              </ListItem>
              {selectedApp.status === 'APPROVED' && (
                <>
                  <ListItem>
                    <ListItemText
                      primary="승인 한도"
                      secondary={`${selectedApp.approvedCreditLimit?.toLocaleString()}만원`}
                    />
                  </ListItem>
                  {selectedApp.issuedCardNumber && (
                    <ListItem>
                      <ListItemText primary="발급 카드번호" secondary={selectedApp.issuedCardNumber} />
                    </ListItem>
                  )}
                </>
              )}
              {selectedApp.status === 'REJECTED' && selectedApp.rejectionReason && (
                <ListItem>
                  <ListItemText primary="거절 사유" secondary={selectedApp.rejectionReason} />
                </ListItem>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
