import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Divider,
  Grid,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/api/client';
import { ChatBot } from '@/components/common/ChatBot';
import { AppFooter } from '@/components/common/AppFooter';

// Unsplash 무료 이미지 URLs
const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80',
  card1: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800&q=80',
  card2: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
  promo1: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80',
  promo2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
  promo3: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&q=80',
  lifestyle: 'https://images.unsplash.com/photo-1556742208-999815fca738?w=800&q=80',
};

const quickMenus = [
  { icon: <ReceiptLongIcon />, label: '이용대금 명세서', desc: '결제 예정 금액 확인', path: '/statements' },
  { icon: <CreditCardIcon />, label: '카드 관리', desc: '카드 설정 및 재발급', path: '/cards' },
  { icon: <CardGiftcardIcon />, label: '포인트', desc: '적립/사용 내역 조회', path: '/points' },
  { icon: <SupportAgentIcon />, label: '고객센터', desc: '1:1 문의 및 FAQ', path: '/support/inquiries' },
];

const cardProducts = [
  {
    name: 'MyCard Platinum',
    benefit: '해외 가맹점 3% 적립',
    annual: '국내외 라운지 무료',
    image: IMAGES.card1,
  },
  {
    name: 'MyCard 체크',
    benefit: '전 가맹점 0.5% 적립',
    annual: '연회비 없음',
    image: IMAGES.card2,
  },
];

// 이벤트 이미지 (imageUrl이 없을 때 사용하는 기본 이미지)
const DEFAULT_EVENT_IMAGES = [IMAGES.promo1, IMAGES.promo2, IMAGES.promo3];

interface EventItem {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  imageUrl?: string;
}

export const HomePage = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    apiClient.get('/events', { params: { size: 3 } })
      .then((res) => {
        const list = res.data?.content || res.data || [];
        setEvents(list);
      })
      .catch(() => {
        // 이벤트 로딩 실패 시 빈 목록 유지
      });
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: '#fff', boxShadow: 'none', borderBottom: '1px solid #e0e0e0' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#d32f2f', letterSpacing: -1 }}>
              MyCard
            </Typography>
            <Stack direction="row" spacing={3} sx={{ display: { xs: 'none', md: 'flex' } }}>
              <Typography component={RouterLink} to="/cards/products" sx={{ color: '#333', textDecoration: 'none', fontWeight: 500, '&:hover': { color: '#d32f2f' } }}>
                카드
              </Typography>
              <Typography component={RouterLink} to="/shopping" sx={{ color: '#333', textDecoration: 'none', fontWeight: 500, '&:hover': { color: '#d32f2f' } }}>
                쇼핑
              </Typography>
              <Typography component={RouterLink} to="/events" sx={{ color: '#333', textDecoration: 'none', fontWeight: 500, '&:hover': { color: '#d32f2f' } }}>
                이벤트
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              {isAuthenticated ? (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2" sx={{ color: '#333', fontWeight: 600 }}>
                    {user?.name}님
                  </Typography>
                  <Button
                    variant="text"
                    onClick={async () => { await logout(); navigate('/'); }}
                    sx={{ color: '#666', fontWeight: 500, '&:hover': { color: '#d32f2f', bgcolor: 'transparent' } }}
                  >
                    로그아웃
                  </Button>
                  <Button component={RouterLink} to="/dashboard" variant="contained" sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
                    My카드
                  </Button>
                </Stack>
              ) : (
                <>
                  <Button component={RouterLink} to="/login" variant="outlined" sx={{ borderColor: '#d32f2f', color: '#d32f2f', '&:hover': { bgcolor: '#fff5f5' } }}>
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

      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 400, md: 500 },
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.5)), url(${IMAGES.hero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 600 }}>
            <Typography variant="h3" sx={{ color: '#fff', fontWeight: 700, mb: 2, fontSize: { xs: '1.8rem', md: '2.8rem' }, lineHeight: 1.3 }}>
              더 스마트한 결제 생활,<br />
              MyCard와 함께
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.9)', mb: 4, fontSize: { xs: '1rem', md: '1.1rem' } }}>
              국내외 다양한 혜택부터 편리한 카드 관리까지,<br />
              당신의 일상을 더 풍요롭게 만들어 드립니다.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button component={RouterLink} to={isAuthenticated ? '/dashboard' : '/register'} variant="contained" size="large" sx={{ bgcolor: '#d32f2f', px: 4, py: 1.5, fontSize: '1rem', '&:hover': { bgcolor: '#b71c1c' } }}>
                {isAuthenticated ? '마이페이지' : '카드 신청하기'}
              </Button>
              <Button component={RouterLink} to="/cards/products" variant="outlined" size="large" sx={{ borderColor: '#fff', color: '#fff', px: 4, py: 1.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                카드 혜택 보기
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Quick Menu */}
      <Container maxWidth="lg" sx={{ mt: -6, position: 'relative', zIndex: 10 }}>
        <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <Grid container spacing={3}>
              {quickMenus.map((menu) => (
                <Grid item xs={6} md={3} key={menu.label}>
                  <Box component={RouterLink} to={menu.path} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: 'inherit', p: 2, borderRadius: 2, transition: 'all 0.2s', '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, color: '#d32f2f' }}>
                      {menu.icon}
                    </Box>
                    <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{menu.label}</Typography>
                    <Typography variant="body2" color="text.secondary">{menu.desc}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Container>

      {/* Card Products */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>인기 카드 상품</Typography>
            <Typography color="text.secondary">나에게 맞는 카드를 찾아보세요</Typography>
          </Box>
          <Button component={RouterLink} to="/cards/products" endIcon={<ArrowForwardIcon />} sx={{ color: '#d32f2f' }}>전체보기</Button>
        </Box>
        <Grid container spacing={4}>
          {cardProducts.map((card) => (
            <Grid item xs={12} md={6} key={card.name}>
              <Card sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' } }}>
                <CardMedia component="img" image={card.image} alt={card.name} sx={{ width: { xs: '100%', sm: 200 }, height: { xs: 180, sm: 'auto' }, objectFit: 'cover' }} />
                <CardContent sx={{ flex: 1, p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>{card.name}</Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#d32f2f', mr: 1.5 }} />
                      <Typography variant="body2">{card.benefit}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#d32f2f', mr: 1.5 }} />
                      <Typography variant="body2">{card.annual}</Typography>
                    </Box>
                  </Stack>
                  <Button component={RouterLink} to="/cards/products" variant="outlined" size="small" sx={{ mt: 3, borderColor: '#d32f2f', color: '#d32f2f', '&:hover': { bgcolor: '#fff5f5' } }}>자세히 보기</Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Events Section */}
      <Box sx={{ bgcolor: '#f8f8f8', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>이벤트 & 혜택</Typography>
              <Typography color="text.secondary">놓치면 아쉬운 특별한 혜택들</Typography>
            </Box>
            <Button component={RouterLink} to="/events" endIcon={<ArrowForwardIcon />} sx={{ color: '#d32f2f' }}>전체보기</Button>
          </Box>
          {events.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">현재 진행 중인 이벤트가 없습니다.</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {events.map((event, index) => {
                const badgeLabel = event.status === 'ACTIVE' ? '진행중' : event.status === 'DRAFT' ? '예정' : '종료';
                const badgeColor = event.status === 'ACTIVE' ? '#d32f2f' : event.status === 'DRAFT' ? '#1976d2' : '#999';
                const imageUrl = event.imageUrl || DEFAULT_EVENT_IMAGES[index % DEFAULT_EVENT_IMAGES.length];
                const startDate = new Date(event.startDate).toLocaleDateString('ko-KR');
                const endDate = new Date(event.endDate).toLocaleDateString('ko-KR');
                return (
                  <Grid item xs={12} md={4} key={event.id}>
                    <Card
                      sx={{ height: '100%', transition: 'transform 0.2s', cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)' } }}
                      onClick={() => navigate('/events')}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia component="img" image={imageUrl} alt={event.title} sx={{ height: 180, objectFit: 'cover' }} />
                        <Box sx={{ position: 'absolute', top: 12, left: 12, bgcolor: badgeColor, color: '#fff', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 700 }}>
                          {badgeLabel}
                        </Box>
                      </Box>
                      <CardContent>
                        <Typography sx={{ fontWeight: 700, mb: 1 }}>{event.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-line' }}>{event.description}</Typography>
                        <Typography variant="caption" color="text.secondary">{startDate} ~ {endDate}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Container>
      </Box>



      <AppFooter />
      <ChatBot />
    </Box>
  );
};
