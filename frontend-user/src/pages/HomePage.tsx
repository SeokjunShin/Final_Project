import { Link as RouterLink } from 'react-router-dom';
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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useAuth } from '@/contexts/AuthContext';

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

const events = [
  {
    title: '신규 가입 캐시백 이벤트',
    desc: '첫 결제 시 20,000원 캐시백',
    period: '2026.02.01 ~ 02.28',
    image: IMAGES.promo1,
    badge: 'HOT',
  },
  {
    title: '해외 결제 수수료 면제',
    desc: '해외 이용 시 수수료 0원',
    period: '2026.02.01 ~ 03.31',
    image: IMAGES.promo2,
    badge: 'NEW',
  },
  {
    title: '주유 할인 프로모션',
    desc: '리터당 최대 100원 할인',
    period: '2026.02.15 ~ 03.15',
    image: IMAGES.promo3,
    badge: '혜택',
  },
];

export const HomePage = () => {
  const { isAuthenticated } = useAuth();

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
              <Typography component={RouterLink} to="/points" sx={{ color: '#333', textDecoration: 'none', fontWeight: 500, '&:hover': { color: '#d32f2f' } }}>
                포인트
              </Typography>
              <Typography component={RouterLink} to="/support/inquiries" sx={{ color: '#333', textDecoration: 'none', fontWeight: 500, '&:hover': { color: '#d32f2f' } }}>
                고객센터
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              {isAuthenticated ? (
                <Button component={RouterLink} to="/dashboard" variant="contained" sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
                  My카드
                </Button>
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
          <Grid container spacing={3}>
            {events.map((event) => (
              <Grid item xs={12} md={4} key={event.title}>
                <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia component="img" image={event.image} alt={event.title} sx={{ height: 180, objectFit: 'cover' }} />
                    <Box sx={{ position: 'absolute', top: 12, left: 12, bgcolor: event.badge === 'HOT' ? '#d32f2f' : event.badge === 'NEW' ? '#1976d2' : '#ff9800', color: '#fff', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 700 }}>
                      {event.badge}
                    </Box>
                  </Box>
                  <CardContent>
                    <Typography sx={{ fontWeight: 700, mb: 1 }}>{event.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{event.desc}</Typography>
                    <Typography variant="caption" color="text.secondary">{event.period}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Benefits Banner */}
      <Box sx={{ backgroundImage: `linear-gradient(rgba(211,47,47,0.9), rgba(183,28,28,0.9)), url(${IMAGES.lifestyle})`, backgroundSize: 'cover', backgroundPosition: 'center', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
                MyCard 앱으로<br />더 편리하게
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', mb: 3 }}>
                카드 이용 내역 실시간 알림, 간편 결제 설정,<br />포인트 조회까지 한 번에 관리하세요.
              </Typography>
              <Button variant="contained" sx={{ bgcolor: '#fff', color: '#d32f2f', '&:hover': { bgcolor: '#f5f5f5' } }}>앱 다운로드</Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Grid container spacing={3}>
                {[
                  { icon: <AccountBalanceWalletIcon />, title: '간편 결제', desc: '터치 한 번으로' },
                  { icon: <NotificationsIcon />, title: '실시간 알림', desc: '즉시 확인' },
                  { icon: <CardGiftcardIcon />, title: '포인트 적립', desc: '자동 적립' },
                  { icon: <SupportAgentIcon />, title: '24시간 상담', desc: '언제든지' },
                ].map((item) => (
                  <Grid item xs={6} key={item.title}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 2.5, textAlign: 'center' }}>
                      <Box sx={{ color: '#fff', mb: 1 }}>{item.icon}</Box>
                      <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>{item.desc}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#1a1a1a', color: '#999', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={3}>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>MyCard</Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.8 }}>고객의 일상에 가치를 더하는<br />금융 파트너가 되겠습니다.</Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>서비스</Typography>
              <Stack spacing={1}>
                <Typography component={RouterLink} to="/cards/products" variant="body2" sx={{ color: '#999', textDecoration: 'none', '&:hover': { color: '#fff' } }}>카드 상품</Typography>
                <Typography component={RouterLink} to="/points" variant="body2" sx={{ color: '#999', textDecoration: 'none', '&:hover': { color: '#fff' } }}>포인트</Typography>
                <Typography component={RouterLink} to="/statements" variant="body2" sx={{ color: '#999', textDecoration: 'none', '&:hover': { color: '#fff' } }}>명세서</Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>고객지원</Typography>
              <Stack spacing={1}>
                <Typography component={RouterLink} to="/support/inquiries" variant="body2" sx={{ color: '#999', textDecoration: 'none', '&:hover': { color: '#fff' } }}>1:1 문의</Typography>
                <Typography component={RouterLink} to="/notifications" variant="body2" sx={{ color: '#999', textDecoration: 'none', '&:hover': { color: '#fff' } }}>공지사항</Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Typography sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>고객센터</Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon sx={{ fontSize: 18, mr: 1.5, color: '#666' }} />
                  <Typography variant="body2">1588-0000 (평일 09:00~18:00)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon sx={{ fontSize: 18, mr: 1.5, color: '#666' }} />
                  <Typography variant="body2">support@mycard.co.kr</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOnIcon sx={{ fontSize: 18, mr: 1.5, color: '#666' }} />
                  <Typography variant="body2">서울특별시 강남구 테헤란로 123</Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ borderColor: '#333', my: 4 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body2">© 2026 MyCard. All rights reserved.</Typography>
            <Stack direction="row" spacing={3}>
              <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: '#fff' } }}>개인정보처리방침</Typography>
              <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: '#fff' } }}>이용약관</Typography>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};
