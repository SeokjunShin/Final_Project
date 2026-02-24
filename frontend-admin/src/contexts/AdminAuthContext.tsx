import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthUser, Role } from '@shared/types';
import { hasAnyRole } from '@shared/auth';
import { adminAuthApi } from '@/api/auth';
import { adminTokenStorage } from '@/api/client';
import type { AdminLoginRequest } from '@/types';

interface AdminAuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  isAuthenticated: boolean;
  login: (payload: AdminLoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  canAccess: (roles: Role[]) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = adminTokenStorage.getAccessToken();
    const cached = localStorage.getItem('admin_profile');
    if (cached) {
      setUser(JSON.parse(cached));
    }
    if (!token) {
      setReady(true);
      return;
    }
    adminAuthApi
      .me()
      .then((profile) => {
        setUser(profile);
        localStorage.setItem('admin_profile', JSON.stringify(profile));
      })
      .finally(() => setReady(true));
  }, []);

  const login = async (payload: AdminLoginRequest) => {
    const data = await adminAuthApi.login(payload);
    setUser(data.user);
  };

  const logout = async () => {
    await adminAuthApi.logout();
    setUser(null);
  };

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      user,
      ready,
      isAuthenticated: Boolean(user && adminTokenStorage.getAccessToken()),
      login,
      logout,
      canAccess: (roles) => hasAnyRole(user?.role, roles),
    }),
    [ready, user],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};
