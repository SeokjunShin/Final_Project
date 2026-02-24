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
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useAuth } from '@/contexts/AuthContext';
import platinumCard from '@/assets/cards/mycard-platinum.svg';

const features = [
  { icon: <CreditScoreIcon />, title: '카드 관리', description: '카드 상태/해외결제/재발급 요청을 한 번에 관리합니다.' },
  { icon: <ReceiptLongIcon />, title: '명세서/승인내역', description: '목록-상세-CSV 다운로드 흐름으로 이용내역을 추적합니다.' },
  { icon: <AutoGraphIcon />, title: '소비 요약', description: '월별 소비 추이와 결제예정액을 대시보드로 확인합니다.' },
  { icon: <SupportAgentIcon />, title: '고객센터', description: '문의 등록, 답변 이력, 문서/첨부를 포털에서 확인합니다.' },
  { icon: <NotificationsActiveIcon />, title: '알림센터', description: '공지사항과 운영 메시지를 읽음 상태까지 관리합니다.' },
  { icon: <SecurityIcon />, title: '보안 운영', description: 'request_id 기반 추적과 표준 오류 응답 정책을 제공합니다.' },
];

export const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg,#edf4ff 0%,#f7fbff 45%,#ffffff 100%)' }}>
      <Container maxWidth="lg" sx={{ pt: 6, pb: 5 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} lg={6}>
            <Typography variant="h4" sx={{ mb: 1.5 }}>
              MyCard 사용자 포털
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              카드사 운영 환경을 가정한 포털 구조로 대시보드, 명세서, 승인내역, 문의, 문서함을 제공합니다.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
              <Button component={RouterLink} to={isAuthenticated ? '/dashboard' : '/login'} variant="contained" size="large">
                {isAuthenticated ? '대시보드 이동' : '로그인'}
              </Button>
              {!isAuthenticated && (
                <Button component={RouterLink} to="/register" variant="outlined" size="large">
                  회원가입
                </Button>
              )}
            </Stack>
          </Grid>
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent sx={{ p: 1.5 }}>
                <Box component="img" src={platinumCard} alt="MyCard" sx={{ width: '100%', borderRadius: 2 }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          주요 기능
        </Typography>
        <Grid container spacing={2}>
          {features.map((feature) => (
            <Grid item xs={12} md={6} lg={4} key={feature.title}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 1 }}>{feature.icon}</Box>
                  <Typography sx={{ fontWeight: 700, mb: 0.7 }}>{feature.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
