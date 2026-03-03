import { Box, Container, Grid, Typography, Stack, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export const AppFooter = () => {
    return (
        <Box sx={{ bgcolor: '#1a1a1a', color: '#999', py: 6, mt: 'auto' }}>
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
                        <Typography component={RouterLink} to="/privacy" variant="body2" sx={{ cursor: 'pointer', textDecoration: 'none', color: '#999', '&:hover': { color: '#fff' } }}>개인정보처리방침</Typography>
                        <Typography component={RouterLink} to="/terms" variant="body2" sx={{ cursor: 'pointer', textDecoration: 'none', color: '#999', '&:hover': { color: '#fff' } }}>이용약관</Typography>
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
};
