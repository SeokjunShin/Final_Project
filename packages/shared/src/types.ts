export type Role = 'USER' | 'OPERATOR' | 'MASTER_ADMIN' | 'REVIEW_ADMIN';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  hasSecondaryPassword?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
