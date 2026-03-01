import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Card, CardContent, Stack, TextField, Typography, Avatar, Divider, Chip } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { SecondAuthDialog } from '@/components/common/SecondAuthDialog';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import HomeIcon from '@mui/icons-material/Home';
import SecurityIcon from '@mui/icons-material/Security';
import EditIcon from '@mui/icons-material/Edit';

const profileSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력하세요.'),
  name: z.string().min(1, '이름을 입력하세요.'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export const MyProfilePage = () => {
  const { show } = useSnackbar();

  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const { data } = await apiClient.get('/me');
      return data;
    },
  });

  const navigate = useNavigate();
  const [secondAuthPassed, setSecondAuthPassed] = useState(() => sessionStorage.getItem('second_auth_passed') === 'true');
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      currentPassword: '',
      name: data?.name ?? '',
      phone: data?.phone ?? '',
      address: data?.address ?? '',
    },
  });

  const updateProfile = useMutation({
    mutationFn: (payload: ProfileForm) => apiClient.patch('/me', payload),
    onSuccess: () => {
      show('내 정보가 수정되었습니다.', 'success');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
    onError: () => show('수정에 실패했습니다.', 'error'),
  });

  return (
    <Box maxWidth="sm" sx={{ mx: 'auto', mt: 2 }}>
      {!secondAuthPassed && (
        <SecondAuthDialog
          open={true}
          onClose={() => navigate('/')}
          onSuccess={() => setSecondAuthPassed(true)}
        />
      )}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <SecurityIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#333' }}>
          내정보
        </Typography>
      </Stack>

      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ p: 0 }}>
          {/* 상단 프로필 헤더 영역 */}
          <Box sx={{ bgcolor: '#fff5f5', p: 4, textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
            <Avatar
              sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: '#d32f2f', fontSize: '2rem', fontWeight: 600, boxShadow: '0 4px 15px rgba(211,47,47,0.3)' }}
            >
              {data?.name ? data.name.substring(0, 1) : '익'}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#333', mb: 0.5 }}>
              {data?.name || '고객'}님, 안녕하세요!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              회원님의 소중한 정보를 안전하게 관리하고 있습니다.
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            {isEditing ? (
              <Stack spacing={3} component="form" onSubmit={form.handleSubmit((v) => updateProfile.mutate(v))}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#d32f2f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EditIcon fontSize="small" /> 정보 수정
                </Typography>
                <TextField label="이름" {...form.register('name')} error={!!form.formState.errors.name} helperText={form.formState.errors.name?.message} fullWidth disabled />
                <TextField label="연락처 옵션" {...form.register('phone')} fullWidth placeholder="010-0000-0000" />
                <TextField label="배송 주소" {...form.register('address')} fullWidth placeholder="거주하시는 주소를 입력해주세요" />

                <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #eee' }}>
                  <Typography variant="caption" sx={{ color: '#666', mb: 1.5, display: 'block' }}>
                    본인 확인을 위해 현재 로그인된 계정의 비밀번호를 입력해주세요. <br /> (2차 비밀번호 아님)
                  </Typography>
                  <TextField
                    label="계정 비밀번호"
                    type="password"
                    {...form.register('currentPassword')}
                    error={!!form.formState.errors.currentPassword}
                    helperText={form.formState.errors.currentPassword?.message}
                    fullWidth
                    size="small"
                  />
                </Box>

                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <Button variant="contained" type="submit" disabled={updateProfile.isPending} fullWidth sx={{ py: 1.5, fontSize: '1rem', fontWeight: 600, bgcolor: '#333', '&:hover': { bgcolor: '#000' } }}>
                    지금 저장하기
                  </Button>
                  <Button variant="outlined" color="inherit" disabled={updateProfile.isPending} onClick={() => setIsEditing(false)} fullWidth sx={{ py: 1.5, fontSize: '1rem', fontWeight: 600 }}>
                    취소
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Stack spacing={0}>
                {/* 이름 */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PersonIcon sx={{ color: '#999' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>이름</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>{data?.name || '-'}</Typography>
                  </Box>
                </Stack>
                <Divider />

                {/* 연락처 */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PhoneIphoneIcon sx={{ color: '#999' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>연락처</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                      {data?.phone ? <Chip label={data.phone} size="small" variant="outlined" /> : <Typography color="text.disabled">등록된 연락처가 없습니다.</Typography>}
                    </Typography>
                  </Box>
                </Stack>
                <Divider />

                {/* 주소 */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HomeIcon sx={{ color: '#999' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>배송 주소</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                      {data?.address || <Typography color="text.disabled">등록된 주소가 없습니다.</Typography>}
                    </Typography>
                  </Box>
                </Stack>

                {/* 하단 버튼 영역 */}
                <Box sx={{ pt: 4, pb: 1, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                    sx={{
                      py: 1.2,
                      px: 4,
                      borderRadius: 10,
                      fontWeight: 600,
                      borderWidth: 2,
                      borderColor: '#d32f2f',
                      color: '#d32f2f',
                      '&:hover': { bgcolor: '#fff5f5', borderWidth: 2, borderColor: '#b71c1c' }
                    }}
                  >
                    내 정보 수정하기
                  </Button>
                </Box>
              </Stack>
            )}
          </Box>
        </CardContent>
      </Card>

    </Box>
  );
};
