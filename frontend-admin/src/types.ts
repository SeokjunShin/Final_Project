import type { AuthUser, PageResponse } from '@shared/types';

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

export interface QueueItem {
  id: number;
  category?: string;
  title: string;
  status: string;
  assignee?: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  occurredAt: string;
  actor: string;
  action: string;
  target: string;
}

export type Paged<T> = PageResponse<T>;
