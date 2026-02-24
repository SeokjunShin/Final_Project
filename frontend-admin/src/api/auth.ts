import type { AuthUser } from '@shared/types';
import type { AdminLoginRequest, AdminLoginResponse } from '@/types';
import { adminApiClient, adminTokenStorage } from './client';

export const adminAuthApi = {
  login: async (payload: AdminLoginRequest) => {
    const { data } = await adminApiClient.post<AdminLoginResponse>('/auth/login', payload);
    adminTokenStorage.setAccessToken(data.accessToken);
    if (data.refreshToken) {
      adminTokenStorage.setRefreshToken(data.refreshToken);
    }
    localStorage.setItem('admin_profile', JSON.stringify(data.user));
    return data;
  },
  me: () => adminApiClient.get<AuthUser>('/auth/me').then((r) => r.data),
  logout: async () => {
    await adminApiClient.post('/auth/logout');
    adminTokenStorage.clear();
  },
};
