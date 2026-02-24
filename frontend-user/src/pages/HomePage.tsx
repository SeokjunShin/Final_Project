import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import SecurityIcon from '@mui/icons-material/Security';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SpeedIcon from '@mui/icons-material/Speed';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  {
    icon: <CreditCardIcon sx={{ fontSize: 48 }} />,
    title: '내 카드 관리',
    description: '카드 상태 확인, 한도 조회, 해외 결제 설정 등 편리한 카드 관리',
  },
  {
    icon: <ReceiptLongIcon sx={{ fontSize: 48 }} />,
    title: '이용내역 조회',
    description: '실시간 승인내역과 월별 명세서를 한눈에 확인',
  },
  {
    icon: <LocalAtmIcon sx={{ fontSize: 48 }} />,
    title: '포인트 전환',
    description: '적립된 포인트를 현금으로 전환하고 관리',
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 48 }} />,
    title: '보안 관리',
    description: '카드 분실 신고, 일시 정지 등 신속한 보안 조치',
  },
  {
    icon: <SupportAgentIcon sx={{ fontSize: 48 }} />,
    title: '고객 지원',
    description: '1:1 문의 및 빠른 상담원 연결',
  },
  {
    icon: <SpeedIcon sx={{ fontSize: 48 }} />,
    title: '빠른 서비스',
    description: '언제 어디서나 빠르고 편리하게 이용',
  },
];

export const HomePage = () => {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f7fb' }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          py: 2,
          px: 3,
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              MyCard
            </Typography>
            <Stack direction="row" spacing={2}>
              {isAuthenticated ? (
                <Button
                  component={RouterLink}
                  to="/dashboard"
                  variant="contained"
                  color="primary"
                >
                  내 카드 관리
                </Button>
              ) : (
                <>
                  <Button component={RouterLink} to="/login" variant="outlined">
                    로그인
                  </Button>
                  <Button component={RouterLink} to="/login" variant="contained">
                    회원가입
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          py: 10,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
                스마트한 카드 생활
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                MyCard와 함께 더 편리하고 안전한 금융 서비스를 경험하세요
              </Typography>
              <Stack direction="row" spacing={2}>
                {isAuthenticated ? (
                  <Button
                    component={RouterLink}
                    to="/dashboard"
                    variant="contained"
                    size="large"
                    sx={{
                      backgroundColor: 'white',
                      color: theme.palette.primary.main,
                      '&:hover': { backgroundColor: '#f0f0f0' },
                    }}
                  >
                    대시보드 바로가기
                  </Button>
                ) : (
                  <>
                    <Button
                      component={RouterLink}
                      to="/login"
                      variant="contained"
                      size="large"
                      sx={{
                        backgroundColor: 'white',
                        color: theme.palette.primary.main,
                        '&:hover': { backgroundColor: '#f0f0f0' },
                      }}
                    >
                      시작하기
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/login"
                      variant="outlined"
                      size="large"
                      sx={{
                        borderColor: 'white',
                        color: 'white',
                        '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
                      }}
                    >
                      로그인
                    </Button>
                  </>
                )}
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <CreditCardIcon sx={{ fontSize: 280, opacity: 0.3 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" align="center" sx={{ fontWeight: 700, mb: 1 }}>
          주요 서비스
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6 }}>
          MyCard가 제공하는 다양한 서비스를 만나보세요
        </Typography>
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ py: 8, backgroundColor: 'white' }}>
        <Container maxWidth="md">
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              textAlign: 'center',
              py: 6,
              px: 4,
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              지금 바로 시작하세요
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
              MyCard와 함께 더 스마트한 카드 생활을 시작해보세요
            </Typography>
            {!isAuthenticated && (
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: 'white',
                  color: theme.palette.primary.main,
                  px: 4,
                  '&:hover': { backgroundColor: '#f0f0f0' },
                }}
              >
                무료로 시작하기
              </Button>
            )}
          </Card>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 4,
          px: 3,
          backgroundColor: '#1a1a2e',
          color: 'white',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                MyCard
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                더 스마트한 카드 생활의 시작
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                고객센터
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                1588-0000
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                평일 09:00 - 18:00
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                서비스
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                이용약관 | 개인정보처리방침
              </Typography>
            </Grid>
          </Grid>
          <Typography variant="body2" align="center" sx={{ mt: 4, opacity: 0.5 }}>
            © 2026 MyCard. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};
