import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
import { useAuth } from '@/contexts/AuthContext';

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
  content: string;
  startDate: string;
  endDate: string;
  status: string;
}

const publicEvents: Event[] = [
  {
    id: 1,
    title: '봄맞이 캐시백 이벤트',
    content: '기간 내 응모하시면 추첨을 통해 최대 10만원 캐시백을 드립니다. 3월 한 달간 MyCard로 50만원 이상 결제 시 자동 응모됩니다.',
    startDate: '2026-03-01',
    endDate: '2026-04-30',
    status: 'ACTIVE',
  },
  {
    id: 2,
    title: '해외 결제 수수료 면제',
    content: '해외 가맹점에서 MyCard Platinum 결제 시 결제 수수료가 면제됩니다. 월 5회까지 적용됩니다.',
    startDate: '2026-02-01',
    endDate: '2026-03-31',
    status: 'ACTIVE',
  },
  {
    id: 3,
    title: '신규 가입 웰컴 포인트',
    content: '신규 가입 후 첫 결제 시 5,000 포인트를 드립니다. 회원가입 후 30일 이내 사용해주세요.',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'ACTIVE',
  },
  {
    id: 4,
    title: '주유 할인 프로모션',
    content: 'SK주유소에서 MyCard로 결제 시 리터당 100원 할인! 월 최대 5만원까지 할인 가능합니다.',
    startDate: '2026-02-15',
    endDate: '2026-03-15',
    status: 'ACTIVE',
  },
];

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
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
        <Grid container spacing={3}>
          {publicEvents.map((event, index) => {
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
                    height="200"
                    image={EVENT_IMAGES[index % EVENT_IMAGES.length]}
                    alt={event.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', flex: 1, pr: 1 }}>
                        {event.title}
                      </Typography>
                      <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
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
                      {event.content}
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
                src={EVENT_IMAGES[publicEvents.findIndex(e => e.id === selectedEvent.id) % EVENT_IMAGES.length]}
                alt={selectedEvent.title}
                sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 1, mb: 2 }}
              />
              <Typography sx={{ mb: 2, lineHeight: 1.8, color: '#333' }}>
                {selectedEvent.content}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <CalendarTodayIcon sx={{ fontSize: 18, color: '#666' }} />
                <Typography variant="body2" color="text.secondary">
                  이벤트 기간: {selectedEvent.startDate} ~ {selectedEvent.endDate}
                </Typography>
              </Stack>
              {!isAuthenticated && (
                <Box sx={{ bgcolor: '#fff5f5', p: 2, borderRadius: 1, textAlign: 'center' }}>
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
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
