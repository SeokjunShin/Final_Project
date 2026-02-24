export type Role = 'USER' | 'OPERATOR' | 'ADMIN';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
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
