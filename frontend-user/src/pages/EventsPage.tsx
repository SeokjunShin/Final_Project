import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { apiClient } from '@/api/client';

// 이벤트 이미지 (Unsplash 무료 이미지)
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
  isParticipated?: boolean;
}

const fallbackEvents: Event[] = [
  {
    id: 1,
    title: '봄맞이 캐시백 이벤트',
    description: '기간 내 응모하시면 추첨을 통해 최대 10만원 캐시백을 드립니다. 3월 한 달간 MyCard로 50만원 이상 결제 시 자동 응모됩니다.',
    startDate: '2026-03-01',
    endDate: '2026-04-30',
    status: 'ACTIVE',
    isParticipated: false,
  },
  {
    id: 2,
    title: '해외 결제 수수료 면제',
    description: '해외 가맹점에서 MyCard Platinum 결제 시 결제 수수료가 면제됩니다. 월 5회까지 적용됩니다.',
    startDate: '2026-02-01',
    endDate: '2026-03-31',
    status: 'ACTIVE',
    isParticipated: true,
  },
  {
    id: 3,
    title: '신규 가입 웰컴 포인트',
    description: '신규 가입 후 첫 결제 시 5,000 포인트를 드립니다. 회원가입 후 30일 이내 사용해주세요.',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'ACTIVE',
    isParticipated: false,
  },
  {
    id: 4,
    title: '주유 할인 프로모션',
    description: 'SK주유소에서 MyCard로 결제 시 리터당 100원 할인! 월 최대 5만원까지 할인 가능합니다.',
    startDate: '2026-02-15',
    endDate: '2026-03-15',
    status: 'ACTIVE',
    isParticipated: false,
  },
];

export const EventsPage = () => {
  const { show } = useSnackbar();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/events');
        return res.data?.content || fallbackEvents;
      } catch {
        return fallbackEvents;
      }
    },
  });

  const events = data ?? fallbackEvents;

  const handleParticipate = async (eventId: number) => {
    try {
      await apiClient.post(`/events/${eventId}/participate`);
      show('이벤트에 참여되었습니다!', 'success');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch {
      show('이미 참여한 이벤트입니다.', 'info');
    }
    setDialogOpen(false);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { label: '진행중', color: 'success' as const };
      case 'CLOSED': return { label: '종료', color: 'default' as const };
      case 'DRAFT': return { label: '예정', color: 'warning' as const };
      default: return { label: status, color: 'default' as const };
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <EmojiEventsIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>이벤트 & 혜택</Typography>
      </Stack>

      <Grid container spacing={3}>
        {events.map((event: Event, index: number) => {
          const statusInfo = getStatusLabel(event.status);
          return (
            <Grid item xs={12} md={6} key={event.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.12)' },
                }}
                onClick={() => { setSelectedEvent(event); setDialogOpen(true); }}
              >
                <CardMedia
                  component="img"
                  height="180"
                  image={EVENT_IMAGES[index % EVENT_IMAGES.length]}
                  alt={event.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', flex: 1, pr: 1 }}>
                      {event.title}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {event.isParticipated && (
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                          label="참여완료"
                          size="small"
                          sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }}
                        />
                      )}
                      <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
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
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <CalendarTodayIcon sx={{ fontSize: 16, color: '#999' }} />
                    <Typography variant="caption" color="text.secondary">
                      {event.startDate} ~ {event.endDate}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Event Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>{selectedEvent.title}</DialogTitle>
            <DialogContent>
              <Box
                component="img"
                src={EVENT_IMAGES[events.findIndex((e: Event) => e.id === selectedEvent.id) % EVENT_IMAGES.length]}
                alt={selectedEvent.title}
                sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 1, mb: 2 }}
              />
              <Typography sx={{ mb: 2, lineHeight: 1.8, color: '#333' }}>
                {selectedEvent.description}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 18, color: '#666' }} />
                <Typography variant="body2" color="text.secondary">
                  이벤트 기간: {selectedEvent.startDate} ~ {selectedEvent.endDate}
                </Typography>
              </Stack>
              {selectedEvent.isParticipated && (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="이미 참여한 이벤트입니다"
                  sx={{ mt: 1, bgcolor: '#e8f5e9', color: '#2e7d32' }}
                />
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
    </Box>
  );
};
