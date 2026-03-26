import { apiClient, tokenStorage } from './client';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@/types';
import type { AuthUser } from '@shared/types';
import { clearSecondAuthPassed, markSecondAuthPassed } from '@/utils/secondAuth';

export const authApi = {
  register: async (payload: RegisterRequest) => {
    const { data } = await apiClient.post<RegisterResponse>('/auth/register', payload);
    return data;
  },
  checkEmail: async (email: string) => {
    const { data } = await apiClient.get<{ exists: boolean }>('/auth/check-email', { params: { email } });
    return data;
  },
  login: async (payload: LoginRequest) => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
    clearSecondAuthPassed();
    tokenStorage.setAccessToken(data.accessToken);
    if (data.refreshToken) {
      tokenStorage.setRefreshToken(data.refreshToken);
    }
    localStorage.setItem('user_profile', JSON.stringify(data.user));
    return data;
  },
  loginReactivate: async (payload: LoginRequest) => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login/reactivate', payload);
    clearSecondAuthPassed();
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
    markSecondAuthPassed();
    return data;
  },
  logout: async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await apiClient.post('/auth/logout', refreshToken ? { refreshToken } : undefined);
    } finally {
      tokenStorage.clear();
      clearSecondAuthPassed();
    }
  },
  me: async () => {
    const { data } = await apiClient.get<AuthUser>('/auth/me');
    localStorage.setItem('user_profile', JSON.stringify(data));
    return data;
  },
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>('/auth/password/reset/request', { email });
    return data;
  },
  verifyPasswordRecovery: async (payload: { email: string; otpCode: string }): Promise<{ success: boolean; message: string; resetToken: string }> => {
    const { data } = await apiClient.post<{ success: boolean; message: string; resetToken: string }>('/auth/password/reset/verify', payload);
    return data;
  },
  confirmPasswordReset: async (payload: { email: string; resetToken: string; newPassword: string }) => {
    await apiClient.post('/auth/password/reset/confirm', payload);
  },
};
