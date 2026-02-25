import {
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
  Grid,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { adminApi } from '@/api';
import type { CardApplication } from '@/types';

const statusMap: Record<string, { label: string; color: 'default' | 'info' | 'success' | 'error' }> = {
  PENDING: { label: '대기중', color: 'default' },
  REVIEWING: { label: '심사중', color: 'info' },
  APPROVED: { label: '승인', color: 'success' },
  REJECTED: { label: '거절', color: 'error' },
};

const employmentTypeMap: Record<string, string> = {
  EMPLOYED: '직장인',
  SELF_EMPLOYED: '자영업자',
  FREELANCER: '프리랜서',
  STUDENT: '학생',
  HOUSEWIFE: '주부',
  UNEMPLOYED: '무직',
  RETIRED: '은퇴',
};

export const CardApplicationsPage = () => {
  const [applications, setApplications] = useState<CardApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  // 상세 다이얼로그
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<CardApplication | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 승인 다이얼로그
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [creditLimit, setCreditLimit] = useState('');

  // 거절 다이얼로그
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // 처리중 상태
  const [processing, setProcessing] = useState(false);

  // 데이터 로드
  const loadApplications = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { page, size: rowsPerPage };
      if (statusFilter) params.status = statusFilter;
      
      const data = await adminApi.cardApplications(params);
      setApplications(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (e) {
      console.error('카드 신청 목록 로드 실패:', e);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [page, rowsPerPage, statusFilter]);

  // 상세 보기
  const handleViewDetail = async (app: CardApplication) => {
    setSelectedApp(app);
    setDetailDialogOpen(true);
    setDetailLoading(true);
    try {
      const detail = await adminApi.cardApplicationDetail(app.id);
      setSelectedApp(detail);
    } catch {
      // 실패시 기본 데이터 사용
    } finally {
      setDetailLoading(false);
    }
  };

  // 심사 시작
  const handleStartReview = async (app: CardApplication) => {
    try {
      setProcessing(true);
      await adminApi.startReview(app.id);
      loadApplications();
    } catch (e) {
      console.error('심사 시작 실패:', e);
      alert('심사 시작에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  // 승인 다이얼로그 열기
  const handleOpenApprove = (app: CardApplication) => {
    setSelectedApp(app);
    setCreditLimit(app.requestedCreditLimit?.toString() || '500');
    setApproveDialogOpen(true);
  };

  // 거절 다이얼로그 열기
  const handleOpenReject = (app: CardApplication) => {
    setSelectedApp(app);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  // 승인 처리
  const handleApprove = async () => {
    if (!selectedApp || !creditLimit) return;
    try {
      setProcessing(true);
      await adminApi.approveCardApplication(selectedApp.id, Number(creditLimit));
      setApproveDialogOpen(false);
      setDetailDialogOpen(false);
      loadApplications();
    } catch (e) {
      console.error('승인 실패:', e);
      alert('승인 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  // 거절 처리
  const handleReject = async () => {
    if (!selectedApp || !rejectReason.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }
    try {
      setProcessing(true);
      await adminApi.rejectCardApplication(selectedApp.id, rejectReason);
      setRejectDialogOpen(false);
      setDetailDialogOpen(false);
      loadApplications();
    } catch (e) {
      console.error('거절 실패:', e);
      alert('거절 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        카드 신청 관리
      </Typography>

      {/* 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>상태 필터</InputLabel>
                <Select
                  value={statusFilter}
                  label="상태 필터"
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="PENDING">대기중</MenuItem>
                  <MenuItem value="REVIEWING">심사중</MenuItem>
                  <MenuItem value="APPROVED">승인</MenuItem>
                  <MenuItem value="REJECTED">거절</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={9}>
              <Typography variant="body2" color="text.secondary">
                총 {totalElements}건의 신청이 있습니다.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 테이블 */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>신청자</TableCell>
                  <TableCell>카드상품</TableCell>
                  <TableCell>직업</TableCell>
                  <TableCell>희망한도</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>신청일</TableCell>
                  <TableCell>관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        카드 신청 내역이 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id} hover>
                      <TableCell>{app.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{app.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {app.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {app.cardProduct} ({app.cardType})
                      </TableCell>
                      <TableCell>{employmentTypeMap[app.employmentType] || app.employmentType}</TableCell>
                      <TableCell>
                        {app.requestedCreditLimit ? `${app.requestedCreditLimit.toLocaleString()}만원` : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusMap[app.status]?.label || app.status}
                          color={statusMap[app.status]?.color || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(app.createdAt).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => handleViewDetail(app)}>
                          상세
                        </Button>
                        {app.status === 'PENDING' && (
                          <Button
                            size="small"
                            color="info"
                            onClick={() => handleStartReview(app)}
                            disabled={processing}
                          >
                            심사시작
                          </Button>
                        )}
                        {(app.status === 'PENDING' || app.status === 'REVIEWING') && (
                          <>
                            <Button
                              size="small"
                              color="success"
                              onClick={() => handleOpenApprove(app)}
                              disabled={processing}
                            >
                              승인
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleOpenReject(app)}
                              disabled={processing}
                            >
                              거절
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={totalElements}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="페이지당 행수"
            />
          </>
        )}
      </TableContainer>

      {/* 상세 다이얼로그 */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          카드 신청 상세 정보
          <Typography variant="caption" sx={{ ml: 2 }}>
            #{selectedApp?.id}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedApp ? (
            <Grid container spacing={3}>
              {/* 신청 정보 */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  신청자 정보
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="이름" secondary={selectedApp.fullName} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="주민번호 (마스킹)" secondary={selectedApp.maskedSsn} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="연락처" secondary={selectedApp.phone} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="이메일" secondary={selectedApp.email} />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="주소"
                      secondary={`${selectedApp.address} ${selectedApp.addressDetail || ''}`}
                    />
                  </ListItem>
                </List>
              </Grid>

              {/* 직업/소득 정보 */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  직업/소득 정보
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="직업 유형"
                      secondary={employmentTypeMap[selectedApp.employmentType] || selectedApp.employmentType}
                    />
                  </ListItem>
                  {selectedApp.employerName && (
                    <ListItem>
                      <ListItemText primary="직장명" secondary={selectedApp.employerName} />
                    </ListItem>
                  )}
                  {selectedApp.jobTitle && (
                    <ListItem>
                      <ListItemText primary="직업/직책" secondary={selectedApp.jobTitle} />
                    </ListItem>
                  )}
                  <ListItem>
                    <ListItemText
                      primary="연소득"
                      secondary={selectedApp.annualIncome ? `${Number(selectedApp.annualIncome).toLocaleString()}만원` : '미공개'}
                    />
                  </ListItem>
                </List>
              </Grid>

              {/* 카드 정보 */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  신청 카드 정보
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">카드 상품</Typography>
                    <Typography>{selectedApp.cardProduct}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">카드 종류</Typography>
                    <Typography>{selectedApp.cardType}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">희망 한도</Typography>
                    <Typography>
                      {selectedApp.requestedCreditLimit ? `${selectedApp.requestedCreditLimit.toLocaleString()}만원` : '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              {/* 상태 정보 */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  처리 정보
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">상태</Typography>
                    <Chip
                      label={statusMap[selectedApp.status]?.label || selectedApp.status}
                      color={statusMap[selectedApp.status]?.color || 'default'}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">신청일</Typography>
                    <Typography>{new Date(selectedApp.createdAt).toLocaleString('ko-KR')}</Typography>
                  </Grid>
                  {selectedApp.reviewedAt && (
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">처리일</Typography>
                      <Typography>{new Date(selectedApp.reviewedAt).toLocaleString('ko-KR')}</Typography>
                    </Grid>
                  )}
                  {selectedApp.approvedCreditLimit && (
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">승인 한도</Typography>
                      <Typography color="success.main" fontWeight={600}>
                        {selectedApp.approvedCreditLimit.toLocaleString()}만원
                      </Typography>
                    </Grid>
                  )}
                  {selectedApp.rejectionReason && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">거절 사유</Typography>
                      <Typography color="error.main">{selectedApp.rejectionReason}</Typography>
                    </Grid>
                  )}
                  {selectedApp.issuedCardNumber && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">발급 카드</Typography>
                      <Typography>{selectedApp.issuedCardNumber}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions>
          {selectedApp && (selectedApp.status === 'PENDING' || selectedApp.status === 'REVIEWING') && (
            <>
              <Button color="success" onClick={() => handleOpenApprove(selectedApp)} disabled={processing}>
                승인
              </Button>
              <Button color="error" onClick={() => handleOpenReject(selectedApp)} disabled={processing}>
                거절
              </Button>
            </>
          )}
          <Button onClick={() => setDetailDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 승인 다이얼로그 */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>카드 신청 승인</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            <strong>{selectedApp?.fullName}</strong>님의 <strong>{selectedApp?.cardProduct}</strong> 카드 신청을 승인합니다.
          </Typography>
          <TextField
            fullWidth
            required
            label="승인 신용한도"
            type="number"
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">만원</InputAdornment>,
            }}
            helperText={`희망한도: ${selectedApp?.requestedCreditLimit?.toLocaleString() || 0}만원`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)} disabled={processing}>
            취소
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={processing || !creditLimit}
          >
            {processing ? <CircularProgress size={20} /> : '승인'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 거절 다이얼로그 */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>카드 신청 거절</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            <strong>{selectedApp?.fullName}</strong>님의 카드 신청을 거절합니다.
          </Typography>
          <TextField
            fullWidth
            required
            multiline
            rows={3}
            label="거절 사유"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="거절 사유를 입력해주세요"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={processing}>
            취소
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={processing || !rejectReason.trim()}
          >
            {processing ? <CircularProgress size={20} /> : '거절'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
