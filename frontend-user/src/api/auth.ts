import { apiClient, tokenStorage } from './client';
import type { LoginRequest, LoginResponse, RegisterRequest } from '@/types';
import type { AuthUser } from '@shared/types';

export const authApi = {
  register: async (payload: RegisterRequest) => {
    await apiClient.post('/auth/register', payload);
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
  logout: async () => {
    await apiClient.post('/auth/logout');
    tokenStorage.clear();
    sessionStorage.removeItem('second_auth_passed');
  },
  me: async () => {
    const { data } = await apiClient.get<AuthUser>('/auth/me');
    localStorage.setItem('user_profile', JSON.stringify(data));
    return data;
  },
};
