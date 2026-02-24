import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Card, CardContent, Stack, Switch, TextField, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiClient } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';

const profileSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력하세요.'),
  name: z.string().min(1, '이름을 입력하세요.'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export const MyProfilePage = () => {
  const { show } = useSnackbar();

  const { data } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const { data } = await apiClient.get('/me');
      return data;
    },
  });

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
    onSuccess: () => show('내 정보가 수정되었습니다.', 'success'),
    onError: () => show('수정에 실패했습니다.', 'error'),
  });

  const toggle2fa = useMutation({
    mutationFn: (enabled: boolean) =>
      apiClient.post('/me/security', {
        currentPassword: form.getValues('currentPassword'),
        twoFactorEnabled: enabled,
      }),
    onSuccess: () => show('보안 설정이 변경되었습니다.', 'success'),
    onError: () => show('보안 설정 변경에 실패했습니다.', 'error'),
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        내 정보 / 보안 설정
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={2} component="form" onSubmit={form.handleSubmit((v) => updateProfile.mutate(v))}>
            <TextField label="이름" {...form.register('name')} error={!!form.formState.errors.name} helperText={form.formState.errors.name?.message} />
            <TextField label="연락처" {...form.register('phone')} />
            <TextField label="주소" {...form.register('address')} />
            <TextField
              label="현재 비밀번호(재인증)"
              type="password"
              {...form.register('currentPassword')}
              error={!!form.formState.errors.currentPassword}
              helperText={form.formState.errors.currentPassword?.message}
            />
            <Button variant="contained" type="submit" disabled={updateProfile.isPending}>
              저장
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography>2FA(OTP 흐름) 사용</Typography>
            <Switch
              checked={Boolean(data?.twoFactorEnabled)}
              onChange={(_, checked) => toggle2fa.mutate(checked)}
            />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
