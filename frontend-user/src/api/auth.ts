import { apiClient, tokenStorage } from './client';
import type { LoginRequest, LoginResponse, RegisterRequest } from '@/types';
import type { AuthUser } from '@shared/types';

export const authApi = {
  register: async (payload: RegisterRequest) => {
    await apiClient.post('/auth/register', payload);
  },
  checkEmail: async (email: string) => {
    const { data } = await apiClient.get<{ exists: boolean }>('/auth/check-email', { params: { email } });
    return data;
  },
  login: async (payload: LoginRequest) => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
    tokenStorage.setAccessToken(data.accessToken);
    if (data.refreshToken) {
      tokenStorage.setRefreshToken(data.refreshToken);
    }
    localStorage.setItem('user_profile', JSON.stringify(data.user));
    return data;
  },
  loginReactivate: async (payload: LoginRequest) => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login/reactivate', payload);
    tokenStorage.setAccessToken(data.accessToken);
    if (data.refreshToken) {
      tokenStorage.setRefreshToken(data.refreshToken);
    }
    localStorage.setItem('user_profile', JSON.stringify(data.user));
    return data;
  },
  cancelWithdrawalAndLogin: async (payload: LoginRequest & { secondaryPassword: string }) => {
    const { data } = await apiClient.post<LoginResponse>('/auth/withdrawal/cancel', payload);
    tokenStorage.setAccessToken(data.accessToken);
    if (data.refreshToken) {
      tokenStorage.setRefreshToken(data.refreshToken);
    }
    localStorage.setItem('user_profile', JSON.stringify(data.user));
    return data;
  },
  logout: async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await apiClient.post('/auth/logout', refreshToken ? { refreshToken } : undefined);
    } finally {
      tokenStorage.clear();
      sessionStorage.removeItem('second_auth_passed');
    }
  },
  me: async () => {
    const { data } = await apiClient.get<AuthUser>('/auth/me');
    localStorage.setItem('user_profile', JSON.stringify(data));
    return data;
  },
  requestPasswordReset: async (email: string): Promise<{ securityQuestion: string }> => {
    const { data } = await apiClient.post<{ securityQuestion: string }>('/auth/password/reset/request', { email });
    return data;
  },
  verifyPasswordRecovery: async (payload: { email: string; securityAnswer: string }): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post<{ success: boolean; message: string }>('/auth/password/reset/verify', payload);
    return data;
  },
  confirmPasswordReset: async (payload: { email: string; securityAnswer: string; newPassword: string }) => {
    await apiClient.post('/auth/password/reset/confirm', payload);
  },
};
