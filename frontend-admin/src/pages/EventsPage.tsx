import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api';
import { AdminTable } from '@/components/common/AdminTable';

interface EventFormData {
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
}

interface Participant {
  id: number;
  userId: number;
  userName: string;
  email: string;
  isWinner: boolean;
  participatedAt: string;
}

const initialFormData: EventFormData = {
  title: '',
  description: '',
  imageUrl: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
};

const getStatusChip = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return <Chip label="참여가능" color="success" size="small" />;
    case 'CLOSED':
      return <Chip label="마감" color="default" size="small" />;
    case 'DRAFT':
      return <Chip label="준비중" color="warning" size="small" />;
    default:
      return <Chip label={status} size="small" />;
  }
};

export const EventsPage = () => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [creating, setCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // 당첨 처리 다이얼로그
  const [drawOpen, setDrawOpen] = useState(false);
  const [drawEventId, setDrawEventId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [rewardPoints, setRewardPoints] = useState<number>(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      return await adminApi.events();
    },
  });

  const handleClose = async (id: number) => {
    if (!confirm('이벤트를 마감하시겠습니까?')) return;
    await adminApi.closeEvent(id).catch(() => null);
    queryClient.invalidateQueries({ queryKey: ['admin-events'] });
  };

  const handleOpenDraw = async (eventId: number) => {
    setDrawEventId(eventId);
    setSelectedIds([]);
    setRewardPoints(0);
    setLoadingParticipants(true);
    setDrawOpen(true);
    try {
      const data = await adminApi.getParticipants(eventId);
      setParticipants(data);
    } catch {
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDraw = async () => {
    if (!drawEventId || selectedIds.length === 0) return;
    try {
      await adminApi.drawWinners(drawEventId, selectedIds, rewardPoints);
      alert('당첨 처리가 완료되었습니다!');
      setDrawOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    } catch {
      alert('당첨 처리에 실패했습니다.');
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.description || !formData.startDate || !formData.endDate) {
      alert('제목, 내용, 시작일, 종료일을 입력해주세요.');
      return;
    }
    setCreating(true);
    try {
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        const uploadRes = await adminApi.uploadImage(imageFile);
        finalImageUrl = uploadRes.url;
      }

      await adminApi.createEvent({
        title: formData.title,
        description: formData.description,
        imageUrl: finalImageUrl || undefined,
        startDate: formData.startDate + 'T00:00:00',
        endDate: formData.endDate + 'T23:59:59',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      setCreateOpen(false);
      setFormData(initialFormData);
      setImageFile(null);
    } catch {
      alert('이벤트 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">이벤트 데이터를 불러올 수 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          이벤트 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
        >
          이벤트 생성
        </Button>
      </Stack>

      {(!data || data.length === 0) ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">등록된 이벤트가 없습니다.</Typography>
        </Box>
      ) : (
        <AdminTable
          rows={data}
          columns={[
            { field: 'title', headerName: '이벤트명', flex: 2 },
            {
              field: 'period',
              headerName: '기간',
              flex: 2,
              renderCell: (params) => {
                const start = params.row.startDate ? new Date(params.row.startDate).toLocaleDateString('ko-KR') : '-';
                const end = params.row.endDate ? new Date(params.row.endDate).toLocaleDateString('ko-KR') : '-';
                return <span>{start} ~ {end}</span>;
              },
            },
            { field: 'applicants', headerName: '응모자', flex: 0.7 },
            {
              field: 'status',
              headerName: '상태',
              flex: 1,
              renderCell: (params) => getStatusChip(params.row.status),
            },
            {
              field: 'action',
              headerName: '처리',
              flex: 2,
              renderCell: (params) => (
                <Stack direction="row" spacing={1}>
                  {params.row.status === 'ACTIVE' && (
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<BlockIcon />}
                      onClick={() => handleClose(params.row.id)}
                    >
                      마감
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<EmojiEventsIcon />}
                    onClick={() => handleOpenDraw(params.row.id)}
                  >
                    당첨 처리
                  </Button>
                </Stack>
              ),
            },
          ]}
        />
      )}

      {/* 이벤트 생성 다이얼로그 */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>새 이벤트 생성</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="이벤트 제목"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="이벤트 내용"
              fullWidth
              required
              multiline
              minRows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Box>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                이벤트 썸네일 이미지 (선택)
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button variant="outlined" component="label">
                  파일 선택
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                  />
                </Button>
                {imageFile && (
                  <Typography variant="body2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {imageFile.name}
                  </Typography>
                )}
                {!imageFile && (
                  <Typography variant="body2" color="text.disabled">
                    선택된 파일 없음
                  </Typography>
                )}
              </Stack>
            </Box>
            <Stack direction="row" spacing={2}>
              <TextField
                label="시작일"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <TextField
                label="종료일"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating}
            sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
          >
            {creating ? '생성 중...' : '생성'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 당첨 처리 다이얼로그 */}
      <Dialog open={drawOpen} onClose={() => setDrawOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon color="primary" />
          당첨 처리
        </DialogTitle>
        <DialogContent>
          {loadingParticipants ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : participants.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              참여자가 없습니다.
            </Typography>
          ) : (
            <>
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                  이벤트 당첨 보상 (선택)
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  label="지급할 포인트"
                  type="number"
                  value={rewardPoints === 0 ? '' : rewardPoints}
                  onChange={(e) => setRewardPoints(Number(e.target.value))}
                  placeholder="예: 5000"
                  helperText="입력 시 당첨자 전원에게 해당 금액의 포인트가 즉시 지급됩니다."
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                당첨할 참여자를 선택하세요 (여러 명 선택 가능)
              </Typography>
              <List dense>
                {participants.map((p) => (
                  <ListItem
                    key={p.id}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      bgcolor: p.isWinner ? '#fff8e1' : 'transparent',
                      border: p.isWinner ? '1px solid #ffb300' : '1px solid #eee',
                    }}
                    secondaryAction={
                      p.isWinner ? (
                        <Chip label="당첨됨" size="small" color="warning" />
                      ) : null
                    }
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedIds.includes(p.id) || p.isWinner}
                        disabled={p.isWinner}
                        onChange={() => handleToggleSelect(p.id)}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={p.userName}
                      secondary={`${p.email} · 참여일: ${new Date(p.participatedAt).toLocaleDateString('ko-KR')}`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDrawOpen(false)}>닫기</Button>
          <Button
            variant="contained"
            onClick={handleDraw}
            disabled={selectedIds.length === 0}
            startIcon={<EmojiEventsIcon />}
            sx={{ bgcolor: '#ff8f00', '&:hover': { bgcolor: '#e65100' } }}
          >
            {selectedIds.length}명 당첨 처리
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
