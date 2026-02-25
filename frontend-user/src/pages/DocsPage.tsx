import { Box, Button, Card, CardContent, Chip, Grid, LinearProgress, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { docsApi } from '@/api';
import { useSnackbar } from '@/contexts/SnackbarContext';
import FolderIcon from '@mui/icons-material/Folder';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface DocumentItem {
  id: number;
  name?: string;
  docType?: string;
  status: string;
  submittedAt: string;
  rejectionReason?: string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
    case 'REVIEWING':
      return { label: '검토중', color: '#ff9800', icon: <HourglassEmptyIcon sx={{ fontSize: 18 }} /> };
    case 'APPROVED':
      return { label: '승인', color: '#4caf50', icon: <CheckCircleIcon sx={{ fontSize: 18 }} /> };
    case 'REJECTED':
      return { label: '반려', color: '#f44336', icon: <CancelIcon sx={{ fontSize: 18 }} /> };
    default:
      return { label: status, color: '#666', icon: <DescriptionIcon sx={{ fontSize: 18 }} /> };
  }
};

const getDocTypeName = (docType?: string) => {
  switch (docType) {
    case 'INCOME_PROOF': return '소득증빙';
    case 'ID_CARD': return '신분증';
    case 'ADDRESS_PROOF': return '주소증빙';
    case 'EMPLOYMENT': return '재직증명';
    default: return docType || '기타서류';
  }
};

export const DocsPage = () => {
  const { show } = useSnackbar();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('OTHER');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['docs'],
    queryFn: () => docsApi.list(),
  });

  const documents = data ?? [];

  const upload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('docType', docType);
      await docsApi.upload(form);
      show('문서가 제출되었습니다.', 'success');
      setFile(null);
      refetch();
    } catch {
      show('문서 제출에 실패했습니다.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <FolderIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>문서함</Typography>
      </Stack>

      {/* 문서 업로드 */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <UploadFileIcon sx={{ color: '#1976d2' }} />
            <Typography sx={{ fontWeight: 700 }}>문서 제출</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            신분증, 소득증빙 등의 서류를 제출해 주세요. PDF, JPG, PNG 형식을 지원합니다.
          </Typography>

          <Select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            size="small"
            sx={{ mb: 2, minWidth: 180 }}
          >
            <MenuItem value="INCOME_PROOF">소득증빙</MenuItem>
            <MenuItem value="ID_CARD">신분증</MenuItem>
            <MenuItem value="RESIDENCE_PROOF">주소증빙</MenuItem>
            <MenuItem value="EMPLOYMENT_PROOF">재직증명</MenuItem>
            <MenuItem value="OTHER">기타서류</MenuItem>
          </Select>

          <Box
            sx={{
              border: '2px dashed #e0e0e0',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              bgcolor: file ? '#f8fff8' : '#fafafa',
              transition: 'all 0.2s',
              '&:hover': { borderColor: '#d32f2f', bgcolor: '#fff5f5' },
            }}
          >
            {file ? (
              <Stack spacing={1} alignItems="center">
                <DescriptionIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                <Typography sx={{ fontWeight: 600 }}>{file.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {(file.size / 1024).toFixed(1)} KB
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    onClick={upload}
                    disabled={uploading}
                    sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
                  >
                    {uploading ? '제출 중...' : '제출하기'}
                  </Button>
                  <Button variant="outlined" onClick={() => setFile(null)}>
                    취소
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Stack spacing={1} alignItems="center">
                <CloudUploadIcon sx={{ fontSize: 48, color: '#ccc' }} />
                <Typography color="text.secondary">파일을 선택하거나 드래그하세요</Typography>
                <Button component="label" variant="outlined">
                  파일 선택
                  <input hidden type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </Button>
              </Stack>
            )}
          </Box>
          {uploading && <LinearProgress sx={{ mt: 2 }} />}
        </CardContent>
      </Card>

      {/* 제출 서류 목록 */}
      <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 2 }}>제출 서류 목록</Typography>

      {isLoading ? (
        <Card><CardContent><LinearProgress /></CardContent></Card>
      ) : documents.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <FolderIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
          <Typography color="text.secondary">제출된 서류가 없습니다</Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {documents.map((doc: DocumentItem) => {
            const statusInfo = getStatusInfo(doc.status);
            return (
              <Grid item xs={12} md={6} key={doc.id}>
                <Card sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" alignItems="flex-start" spacing={2}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: `${statusInfo.color}15`,
                          color: statusInfo.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {statusInfo.icon}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>
                            [{getDocTypeName(doc.docType)}]
                          </Typography>
                          <Chip
                            label={statusInfo.label}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              bgcolor: `${statusInfo.color}15`,
                              color: statusInfo.color,
                              fontWeight: 600,
                            }}
                          />
                        </Stack>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#d32f2f',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            '&:hover': { color: '#b71c1c' },
                          }}
                          onClick={() => {
                            if (doc.name) {
                              docsApi.download(doc.id, doc.name);
                            }
                          }}
                        >
                          {doc.name || '파일 정보 없음'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doc.submittedAt}
                        </Typography>
                        {doc.status === 'REJECTED' && doc.rejectionReason && (
                          <Typography variant="body2" sx={{ mt: 1, color: '#f44336', fontSize: '0.85rem' }}>
                            반려 사유: {doc.rejectionReason}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};
