import type { Role } from './types';

export const hasAnyRole = (role: Role | null | undefined, allowed: Role[]): boolean => {
  if (!role) {
    return false;
  }
  return allowed.includes(role);
};

export const isAdminRole = (role: Role | null | undefined): boolean => {
  return role === 'OPERATOR' || role === 'MASTER_ADMIN' || role === 'REVIEW_ADMIN';
};
