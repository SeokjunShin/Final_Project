import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AdminLoginResponse } from '@/types';
import { redirectToCommonErrorPage, shouldRedirectToCommonErrorPage } from '@/utils/errorRedirect';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8080/api' : '/api');
const USE_CREDENTIALS = import.meta.env.VITE_API_WITH_CREDENTIALS === 'true';

export const adminTokenStorage = {
  getAccessToken: () => localStorage.getItem('admin_access_token'),
  setAccessToken: (token: string) => localStorage.setItem('admin_access_token', token),
  getRefreshToken: () => localStorage.getItem('admin_refresh_token'),
  setRefreshToken: (token: string) => localStorage.setItem('admin_refresh_token', token),
  clear: () => {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_profile');
  },
};

export const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: USE_CREDENTIALS,
});

let isRefreshing = false;
let queue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const HANDLED_AUTH_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/admin/account/password',
];

const shouldHandleAuthErrorLocally = (url?: string) =>
  typeof url === 'string' && HANDLED_AUTH_PATHS.some((path) => url.includes(path));

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

adminApiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = adminTokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const handledAuthRequest = shouldHandleAuthErrorLocally(original?.url);

    if (status === 401 && !original?._retry && !original?.url?.includes('/auth/login')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return adminApiClient(original);
          })
          .catch((refreshError) => Promise.reject(refreshError));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = adminTokenStorage.getRefreshToken();
        const { data } = await axios.post<AdminLoginResponse>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: USE_CREDENTIALS },
        );

        adminTokenStorage.setAccessToken(data.accessToken);
        if (data.refreshToken) {
          adminTokenStorage.setRefreshToken(data.refreshToken);
        }
        flushQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return adminApiClient(original);
      } catch (refreshError) {
        adminTokenStorage.clear();
        flushQueue(refreshError as Error);
        redirectToCommonErrorPage();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401) {
      adminTokenStorage.clear();
    }

    if (handledAuthRequest) {
      return Promise.reject(error);
    }

    if (shouldRedirectToCommonErrorPage(status) && !original?.url?.includes('/messages')) {
      redirectToCommonErrorPage();
    }

    return Promise.reject(error);
  },
);
