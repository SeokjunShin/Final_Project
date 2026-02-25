import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import FlightIcon from '@mui/icons-material/Flight';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard as CreditCardVisual } from '@/components/common/CreditCard';

interface CardProduct {
  id: number;
  name: string;
  type: 'platinum' | 'gold' | 'check' | 'classic' | 'blue' | 'default';
  category: 'credit' | 'check';
  tagline: string;
  annualFee: number;
  benefits: string[];
  features: { icon: React.ReactNode; text: string }[];
  recommended?: boolean;
}

const cardProducts: CardProduct[] = [
  {
    id: 1,
    name: 'MyCard Platinum',
    type: 'platinum',
    category: 'credit',
    tagline: '프리미엄 라이프를 위한 최상의 선택',
    annualFee: 100000,
    benefits: [
      '국내외 공항 라운지 무료 이용',
      '호텔/리조트 VIP 혜택',
      '발렛파킹 월 2회 무료',
      '골프장 그린피 할인',
    ],
    features: [
      { icon: <FlightIcon />, text: '해외 결제 수수료 면제' },
      { icon: <StarIcon />, text: '포인트 1.5% 적립' },
      { icon: <LocalOfferIcon />, text: '연회비 이상 혜택 보장' },
    ],
    recommended: true,
  },
  {
    id: 2,
    name: 'MyCard Gold',
    type: 'gold',
    category: 'credit',
    tagline: '일상의 모든 소비를 특별하게',
    annualFee: 50000,
    benefits: [
      '온라인 쇼핑 5% 적립',
      '영화관 50% 할인 (월 2회)',
      '스트리밍 서비스 할인',
      '커피 전문점 20% 할인',
    ],
    features: [
      { icon: <ShoppingCartIcon />, text: '쇼핑 특화 혜택' },
      { icon: <StarIcon />, text: '포인트 1.0% 적립' },
      { icon: <LocalOfferIcon />, text: '생활밀착 할인' },
    ],
  },
  {
    id: 3,
    name: 'MyCard Classic',
    type: 'classic',
    category: 'credit',
    tagline: '합리적인 연회비, 확실한 혜택',
    annualFee: 15000,
    benefits: [
      '대중교통 10% 할인',
      '편의점 5% 할인',
      '통신비 자동이체 할인',
      '공과금 포인트 적립',
    ],
    features: [
      { icon: <LocalGasStationIcon />, text: '주유 리터당 50원 할인' },
      { icon: <StarIcon />, text: '포인트 0.7% 적립' },
      { icon: <LocalOfferIcon />, text: '실속형 혜택' },
    ],
  },
  {
    id: 4,
    name: 'MyCard Blue',
    type: 'blue',
    category: 'credit',
    tagline: '2030 맞춤 라이프스타일 카드',
    annualFee: 10000,
    benefits: [
      '배달앱 10% 할인',
      'OTT 서비스 할인',
      '카페 15% 할인',
      '편의점 10% 할인',
    ],
    features: [
      { icon: <RestaurantIcon />, text: '배달/외식 특화' },
      { icon: <StarIcon />, text: '포인트 0.8% 적립' },
      { icon: <LocalOfferIcon />, text: '젊은 감성 혜택' },
    ],
    recommended: true,
  },
  {
    id: 5,
    name: 'MyCard 체크',
    type: 'check',
    category: 'check',
    tagline: '연회비 없이 누리는 알뜰 혜택',
    annualFee: 0,
    benefits: [
      '전월 실적 조건 없음',
      '대중교통 5% 할인',
      '편의점 3% 할인',
      'ATM 수수료 면제',
    ],
    features: [
      { icon: <CheckCircleIcon />, text: '연회비 무료' },
      { icon: <StarIcon />, text: '포인트 0.3% 적립' },
      { icon: <LocalOfferIcon />, text: '조건 없는 혜택' },
    ],
  },
];

export const CardProductsPage = () => {
  const { isAuthenticated } = useAuth();
  const [selectedCard, setSelectedCard] = useState<CardProduct | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const filteredCards = tabValue === 0
    ? cardProducts
    : tabValue === 1
    ? cardProducts.filter(c => c.category === 'credit')
    : cardProducts.filter(c => c.category === 'check');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: '#fff', boxShadow: 'none', borderBottom: '1px solid #e0e0e0' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Button
                component={RouterLink}
                to="/"
                startIcon={<ArrowBackIcon />}
                sx={{ color: '#666' }}
              >
                홈으로
              </Button>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#d32f2f', letterSpacing: -1 }}>
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
            <CreditCardIcon sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>카드 상품 안내</Typography>
              <Typography sx={{ opacity: 0.9 }}>나에게 딱 맞는 MyCard를 찾아보세요</Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Tabs */}
      <Container maxWidth="lg">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fff', mt: -1 }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{
              '& .MuiTab-root': { fontWeight: 600 },
              '& .Mui-selected': { color: '#d32f2f' },
              '& .MuiTabs-indicator': { bgcolor: '#d32f2f' },
            }}
          >
            <Tab label="전체" />
            <Tab label="신용카드" />
            <Tab label="체크카드" />
          </Tabs>
        </Box>
      </Container>

      {/* Card Grid */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {filteredCards.map((card) => (
            <Grid item xs={12} sm={6} lg={4} key={card.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.12)' },
                }}
                onClick={() => { setSelectedCard(card); setDialogOpen(true); }}
              >
                {card.recommended && (
                  <Chip
                    label="추천"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      bgcolor: '#d32f2f',
                      color: '#fff',
                      fontWeight: 600,
                      zIndex: 1,
                    }}
                  />
                )}
                <CardContent sx={{ p: 3 }}>
                  {/* Card Visual */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <CreditCardVisual cardName={card.name} cardType={card.type} size="small" />
                  </Box>

                  {/* Card Info */}
                  <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center', mb: 0.5 }}>
                    {card.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
                    {card.tagline}
                  </Typography>

                  {/* Annual Fee */}
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">연회비</Typography>
                    <Typography sx={{ fontWeight: 700, color: card.annualFee === 0 ? '#4caf50' : '#333' }}>
                      {card.annualFee === 0 ? '무료' : `${card.annualFee.toLocaleString()}원`}
                    </Typography>
                  </Box>

                  {/* Quick Benefits */}
                  <Stack spacing={0.5}>
                    {card.features.map((feature, idx) => (
                      <Stack key={idx} direction="row" alignItems="center" spacing={1} sx={{ color: '#666' }}>
                        <Box sx={{ color: '#d32f2f', display: 'flex' }}>{feature.icon}</Box>
                        <Typography variant="body2">{feature.text}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* CTA */}
        {!isAuthenticated && (
          <Card sx={{ mt: 6, textAlign: 'center', py: 6, background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', color: '#fff' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              지금 가입하고 카드를 신청하세요!
            </Typography>
            <Typography sx={{ opacity: 0.9, mb: 3 }}>
              신규 가입 시 5,000 포인트 즉시 지급
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

      {/* Card Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedCard && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>{selectedCard.name}</DialogTitle>
            <DialogContent>
              <Typography color="text.secondary" sx={{ mb: 3 }}>{selectedCard.tagline}</Typography>

              {/* Card Visual */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <CreditCardVisual cardName={selectedCard.name} cardType={selectedCard.type} size="medium" />
              </Box>

              {/* Annual Fee */}
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">연회비</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: selectedCard.annualFee === 0 ? '#4caf50' : '#d32f2f' }}>
                  {selectedCard.annualFee === 0 ? '무료' : `${selectedCard.annualFee.toLocaleString()}원`}
                </Typography>
              </Box>

              {/* Benefits */}
              <Typography sx={{ fontWeight: 700, mb: 1 }}>주요 혜택</Typography>
              <List dense>
                {selectedCard.benefits.map((benefit, idx) => (
                  <ListItem key={idx} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircleIcon sx={{ color: '#d32f2f', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText primary={benefit} />
                  </ListItem>
                ))}
              </List>

              {/* CTA */}
              {!isAuthenticated && (
                <Box sx={{ bgcolor: '#fff5f5', p: 2, borderRadius: 1, mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#d32f2f', mb: 1 }}>
                    카드를 신청하려면 로그인이 필요합니다.
                  </Typography>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Button
                      component={RouterLink}
                      to="/login"
                      variant="outlined"
                      size="small"
                      sx={{ borderColor: '#d32f2f', color: '#d32f2f' }}
                    >
                      로그인
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/register"
                      variant="contained"
                      size="small"
                      sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
                    >
                      회원가입
                    </Button>
                  </Stack>
                </Box>
              )}
              {isAuthenticated && (
                <Button
                  component={RouterLink}
                  to="/cards/applications"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2, bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
                >
                  이 카드 신청하기
                </Button>
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
