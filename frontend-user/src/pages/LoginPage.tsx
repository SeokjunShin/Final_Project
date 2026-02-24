import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from '@/contexts/SnackbarContext';
import platinumCard from '@/assets/cards/mycard-platinum.svg';
import portalBg from '@/assets/hero/portal-bg.svg';

const schema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요.'),
  password: z.string().min(1, '비밀번호를 입력하세요.'),
});

type FormValues = z.infer<typeof schema>;

export const LoginPage = () => {
  const { login } = useAuth();
  const { show } = useSnackbar();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (value: FormValues) => {
    try {
      await login(value);
      show('로그인되었습니다.', 'success');
      navigate('/dashboard');
    } catch {
      show('로그인에 실패했습니다.', 'error');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(130deg, #e8f0ff 0%, #f7fbff 48%, #eaf5f2 100%)',
        px: 2,
      }}
    >
      <Box
        sx={{
          width: 'min(1140px, 100%)',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.15fr 0.85fr' },
          gap: 2,
        }}
      >
        <Card sx={{ display: { xs: 'none', lg: 'block' }, p: 3, backgroundImage: `url(${portalBg})`, backgroundSize: 'cover' }}>
          <Typography variant="h4" sx={{ mb: 1.2 }}>
            MyCard 고객 포털
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            결제 예정액, 명세서, 승인내역, 문의/문서함을 한 화면에서 관리하세요.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box component="img" src={platinumCard} alt="MyCard 카드" sx={{ width: '92%', maxWidth: 620 }} />
          </Box>
        </Card>

        <Card sx={{ p: 1.5 }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              로그인
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              사용자 포털(mycard.local)
            </Typography>
            <Stack spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
              <TextField label="이메일" autoComplete="username" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
              <TextField
                label="비밀번호"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
              <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                로그인
              </Button>
              <Typography variant="body2" sx={{ textAlign: 'center' }}>
                아직 계정이 없으신가요?{' '}
                <Link component={RouterLink} to="/register" underline="hover">
                  회원가입
                </Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
