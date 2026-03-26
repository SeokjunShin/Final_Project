import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { LoginResponse } from '@/types';
import { redirectToCommonErrorPage, shouldRedirectToCommonErrorPage } from '@/utils/errorRedirect';
import { clearSecondAuthPassed } from '@/utils/secondAuth';

const API_BASE_URL = '/api';
const USE_CREDENTIALS = import.meta.env.VITE_API_WITH_CREDENTIALS === 'true';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem('user_access_token'),
  setAccessToken: (token: string) => localStorage.setItem('user_access_token', token),
  getRefreshToken: () => localStorage.getItem('user_refresh_token'),
  setRefreshToken: (token: string) => localStorage.setItem('user_refresh_token', token),
  clear: () => {
    localStorage.removeItem('user_access_token');
    localStorage.removeItem('user_refresh_token');
    localStorage.removeItem('user_profile');
  },
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: USE_CREDENTIALS,
});

let isRefreshing = false;
let queue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const flushQueue = (error: Error | null, token?: string) => {
  queue.forEach((item) => {
    if (error) {
      item.reject(error);
    } else if (token) {
      item.resolve(token);
    }
  });
  queue = [];
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isLoginRequest = original?.url?.includes('/auth/login');
    const isSecondAuthRequest = original?.url?.includes('/auth/verify-second-password');
    const status = error.response?.status;
    const responseData = error.response?.data as { code?: string } | undefined;
    const errorCode = typeof responseData?.code === 'string' ? responseData.code : undefined;

    const hasToken = tokenStorage.getAccessToken();

    if (errorCode === 'SECOND_AUTH_REQUIRED') {
      clearSecondAuthPassed();
      return Promise.reject(error);
    }

    if (status === 401 && !original?._retry && !isLoginRequest && !isSecondAuthRequest && hasToken) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return apiClient(original);
          })
          .catch((refreshError) => Promise.reject(refreshError));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenStorage.getRefreshToken();
        const { data } = await axios.post<LoginResponse>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: USE_CREDENTIALS },
        );

        tokenStorage.setAccessToken(data.accessToken);
        if (data.refreshToken) {
          tokenStorage.setRefreshToken(data.refreshToken);
        }
        flushQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch (refreshError) {
        tokenStorage.clear();
        clearSecondAuthPassed();
        flushQueue(refreshError as Error);
        redirectToCommonErrorPage();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401 && hasToken) {
      tokenStorage.clear();
      clearSecondAuthPassed();
    }

    if (shouldRedirectToCommonErrorPage(status)) {
      redirectToCommonErrorPage();
    }

    return Promise.reject(error);
  },
);
