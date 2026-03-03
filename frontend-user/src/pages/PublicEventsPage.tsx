import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { ChatBot } from '@/components/common/ChatBot';

// 이벤트 이미지 (Unsplash 무료 이미지) - imageUrl이 없을 때 사용
const EVENT_IMAGES = [
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
  'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
  'https://images.unsplash.com/photo-1556742208-999815fca738?w=800&q=80',
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80',
];

interface Event {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  imageUrl?: string;
  isParticipated?: boolean;
  isWinner?: boolean;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ACTIVE': return { label: '진행중', color: 'success' as const };
    case 'CLOSED': return { label: '종료', color: 'default' as const };
    case 'DRAFT': return { label: '예정', color: 'warning' as const };
    default: return { label: status, color: 'default' as const };
  }
};

export const PublicEventsPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { show } = useSnackbar();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['public-events'],
    queryFn: async () => {
      const res = await apiClient.get('/events');
      return res.data?.content || res.data || [];
    },
  });

  const events: Event[] = data ?? [];

  const getEventImage = (event: Event, index: number) => {
    return event.imageUrl || EVENT_IMAGES[index % EVENT_IMAGES.length];
  };

  const handleParticipate = async (eventId: number) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await apiClient.post(`/events/${eventId}/participate`);
      show('이벤트에 참여되었습니다!', 'success');
      queryClient.invalidateQueries({ queryKey: ['public-events'] });
      setSelectedEvent((prev) => prev ? { ...prev, isParticipated: true } : null);
    } catch (err: any) {
      const message = err?.response?.data?.message || '이벤트 참여에 실패했습니다.';
      if (message.includes('이미 참여')) {
        show('이미 참여한 이벤트입니다.', 'info');
      } else if (message.includes('참여할 수 없는')) {
        show('현재 참여할 수 없는 이벤트입니다.', 'info');
      } else if (message.includes('기간')) {
        show('이벤트 참여 기간이 아닙니다.', 'info');
      } else {
        show(message, 'error');
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: '#fff', boxShadow: 'none', borderBottom: '1px solid #e0e0e0' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography component={RouterLink} to="/" variant="h5" sx={{ fontWeight: 800, color: '#d32f2f', letterSpacing: -1, textDecoration: 'none', '&:hover': { opacity: 0.8 } }}>
                MyCard
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              {isAuthenticated ? (
                <Button component={RouterLink} to="/dashboard" variant="contained" sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
                  My카드
                </Button>
              ) : (
                <>
                  <Button component={RouterLink} to="/login" variant="outlined" sx={{ borderColor: '#d32f2f', color: '#d32f2f' }}>
                    로그인
                  </Button>
                  <Button component={RouterLink} to="/register" variant="contained" sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
                    회원가입
                  </Button>
                </>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero */}
      <Box sx={{ bgcolor: '#d32f2f', color: '#fff', py: 6 }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={2}>
            <EmojiEventsIcon sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>이벤트 & 혜택</Typography>
              <Typography sx={{ opacity: 0.9 }}>MyCard 고객님을 위한 특별한 혜택들</Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Events Grid */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">이벤트를 불러오는 중...</Typography>
          </Box>
        ) : events.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">현재 진행 중인 이벤트가 없습니다.</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {events.map((event, index) => {
              const statusInfo = getStatusLabel(event.status);
              const isClosed = event.status === 'CLOSED';
              return (
                <Grid item xs={12} md={6} key={event.id}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      opacity: isClosed ? 0.75 : 1,
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.12)' },
                    }}
                    onClick={() => { setSelectedEvent(event); setDialogOpen(true); }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={getEventImage(event, index)}
                      alt={event.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', flex: 1, pr: 1 }}>
                          {event.title}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          {event.isWinner ? (
                            <Chip
                              icon={<EmojiEventsIcon sx={{ fontSize: 14 }} />}
                              label="당첨"
                              size="small"
                              sx={{ bgcolor: '#fff8e1', color: '#e65100', fontWeight: 700, fontSize: '0.75rem' }}
                            />
                          ) : event.isParticipated ? (
                            <Chip
                              icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                              label="참여완료"
                              size="small"
                              sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, fontSize: '0.75rem' }}
                            />
                          ) : (
                            <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
                          )}
                        </Stack>
                      </Stack>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {event.description}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <CalendarTodayIcon sx={{ fontSize: 16, color: '#999' }} />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(event.startDate).toLocaleDateString('ko-KR')} ~ {new Date(event.endDate).toLocaleDateString('ko-KR')}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* CTA for non-authenticated */}
        {!isAuthenticated && (
          <Card sx={{ mt: 6, textAlign: 'center', py: 6, background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', color: '#fff' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              지금 가입하고 혜택을 받으세요!
            </Typography>
            <Typography sx={{ opacity: 0.9, mb: 3 }}>
              신규 가입 시 5,000 포인트와 다양한 이벤트 참여 기회가 주어집니다.
            </Typography>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              size="large"
              sx={{ bgcolor: '#fff', color: '#d32f2f', '&:hover': { bgcolor: '#f5f5f5' } }}
            >
              무료 회원가입
            </Button>
          </Card>
        )}
      </Container>

      {/* Event Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>{selectedEvent.title}</DialogTitle>
            <DialogContent>
              <Box
                component="img"
                src={getEventImage(selectedEvent, events.findIndex(e => e.id === selectedEvent.id))}
                alt={selectedEvent.title}
                sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 1, mb: 2 }}
              />
              <Typography sx={{ mb: 2, lineHeight: 1.8, color: '#333', whiteSpace: 'pre-line' }}>
                {selectedEvent.description}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 18, color: '#666' }} />
                <Typography variant="body2" color="text.secondary">
                  이벤트 기간: {new Date(selectedEvent.startDate).toLocaleDateString('ko-KR')} ~ {new Date(selectedEvent.endDate).toLocaleDateString('ko-KR')}
                </Typography>
              </Stack>
              {selectedEvent.isWinner && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fff8e1', borderRadius: 1, textAlign: 'center' }}>
                  <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
                    <EmojiEventsIcon sx={{ fontSize: 18, color: '#e65100' }} />
                    <Typography variant="body2" sx={{ color: '#e65100', fontWeight: 500 }}>
                      🎉 축하합니다! 당첨되었습니다!
                    </Typography>
                  </Stack>
                </Box>
              )}
              {!selectedEvent.isWinner && selectedEvent.isParticipated && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#e8f5e9', borderRadius: 1, textAlign: 'center' }}>
                  <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
                    <CheckCircleIcon sx={{ fontSize: 18, color: '#2e7d32' }} />
                    <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                      이미 참여한 이벤트입니다.
                    </Typography>
                  </Stack>
                </Box>
              )}
              {selectedEvent.status === 'CLOSED' && !selectedEvent.isParticipated && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1, textAlign: 'center' }}>
                  <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
                    <BlockIcon sx={{ fontSize: 18, color: '#999' }} />
                    <Typography variant="body2" color="text.secondary">
                      이 이벤트는 마감되었습니다.
                    </Typography>
                  </Stack>
                </Box>
              )}
              {!isAuthenticated && selectedEvent.status === 'ACTIVE' && (
                <Box sx={{ mt: 2, bgcolor: '#fff5f5', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#d32f2f', mb: 1 }}>
                    이벤트에 참여하려면 로그인이 필요합니다.
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="contained"
                    size="small"
                    sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
                  >
                    로그인하기
                  </Button>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDialogOpen(false)}>닫기</Button>
              {isAuthenticated && selectedEvent.status === 'ACTIVE' && !selectedEvent.isParticipated && (
                <Button
                  variant="contained"
                  onClick={() => handleParticipate(selectedEvent.id)}
                  sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
                >
                  이벤트 참여하기
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
      <ChatBot />
    </Box>
  );
};
