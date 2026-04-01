import type { AuthUser } from '@shared/types';
import type { AdminLoginRequest, AdminLoginResponse, AdminPasswordChangeRequest } from '@/types';
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
  changePassword: async (payload: AdminPasswordChangeRequest) => {
    await adminApiClient.post('/admin/account/password', payload);
  },
  logout: async () => {
    const refreshToken = adminTokenStorage.getRefreshToken();
    try {
      await adminApiClient.post('/auth/logout', refreshToken ? { refreshToken } : undefined);
    } catch {
      // 이미 만료되었거나 권한 없는 토큰이라도 무시
    } finally {
      adminTokenStorage.clear();
    }
  },
};
