import { useState } from 'react';
import {
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
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { apiClient } from '@/api/client';

// 이벤트 이미지 (Unsplash 무료 이미지) - imageUrl이 없을 때 사용
const DEFAULT_IMAGES = [
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

export const EventsPage = () => {
  const { show } = useSnackbar();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await apiClient.get('/events');
      return res.data?.content || res.data || [];
    },
  });

  const events: Event[] = data ?? [];
  const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE);
  const currentEvents = events.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleParticipate = async (eventId: number) => {
    try {
      await apiClient.post(`/events/${eventId}/participate`);
      show('이벤트에 참여되었습니다!', 'success');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      // 다이얼로그 내 상태 업데이트
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

  const getEventImage = (event: Event, index: number) => {
    return event.imageUrl || DEFAULT_IMAGES[index % DEFAULT_IMAGES.length];
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { label: '참여가능', color: 'success' as const };
      case 'CLOSED': return { label: '마감', color: 'default' as const };
      case 'DRAFT': return { label: '예정', color: 'warning' as const };
      default: return { label: status, color: 'default' as const };
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="text.secondary">이벤트를 불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <EmojiEventsIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>이벤트 & 혜택</Typography>
      </Stack>

      {events.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">현재 진행 중인 이벤트가 없습니다.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {currentEvents.map((event: Event, index: number) => {
            const statusInfo = getStatusLabel(event.status);
            const isClosed = event.status === 'CLOSED';
            return (
              <Grid item xs={12} md={6} key={event.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    opacity: isClosed ? 0.75 : 1,
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.12)' },
                  }}
                  onClick={() => { setSelectedEvent(event); setDialogOpen(true); }}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={getEventImage(event, index)}
                    alt={event.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5, gap: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: '1rem',
                          flex: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'keep-all',
                        }}
                      >
                        {event.title}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {event.isWinner && (
                          <Chip
                            icon={<EmojiEventsIcon sx={{ fontSize: 14 }} />}
                            label="당첨"
                            size="small"
                            sx={{ bgcolor: '#fff8e1', color: '#e65100', fontWeight: 700, fontSize: '0.75rem' }}
                          />
                        )}
                        {!event.isWinner && event.isParticipated ? (
                          <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                            label="참여완료"
                            size="small"
                            sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        ) : (
                          <Chip label={statusInfo.label} color={statusInfo.color} size="small" sx={{ fontSize: '0.75rem' }} />
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
                      }}
                    >
                      {event.description}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 'auto', pt: 2 }}>
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

      {totalPages > 1 && (
        <Stack spacing={2} sx={{ mt: 6, mb: 2, alignItems: 'center' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Stack>
      )}

      {/* Event Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>{selectedEvent.title}</DialogTitle>
            <DialogContent>
              <CardMedia
                component="img"
                height="240"
                image={getEventImage(selectedEvent, events.findIndex(e => e.id === selectedEvent.id))}
                alt={selectedEvent.title}
                sx={{ objectFit: 'cover', borderRadius: 1, mb: 2 }}
              />
              <Typography sx={{ mb: 2, lineHeight: 1.8, color: '#333' }}>
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
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDialogOpen(false)}>닫기</Button>
              {selectedEvent.status === 'ACTIVE' && !selectedEvent.isParticipated && (
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
    </Container>
  );
};
