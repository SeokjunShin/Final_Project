import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '@/api/auth';
import { tokenStorage } from '@/api/client';
import type { AuthUser } from '@shared/types';
import type { LoginRequest } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  loginReactivate: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    const cached = localStorage.getItem('user_profile');
    if (cached) {
      setUser(JSON.parse(cached));
    }
    if (!token) {
      setReady(true);
      return;
    }
    authApi
      .me()
      .then((profile) => setUser(profile))
      .finally(() => setReady(true));
  }, []);

  const login = async (payload: LoginRequest) => {
    const result = await authApi.login(payload);
    setUser(result.user);
  };

  const loginReactivate = async (payload: LoginRequest) => {
    const result = await authApi.loginReactivate(payload);
    setUser(result.user);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      isAuthenticated: Boolean(user && tokenStorage.getAccessToken()),
      login,
      loginReactivate,
      logout,
    }),
    [ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
