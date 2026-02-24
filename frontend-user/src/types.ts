import type { AuthUser, PageResponse } from '@shared/types';

export interface ApiError {
  code: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

export interface DashboardSummary {
  dueAmount: number;
  availableLimit: number;
  points: number;
  recentApprovals: Approval[];
  monthlySpend: { month: string; amount: number }[];
}

export interface Statement {
  id: number;
  billingMonth: string;
  cardName: string;
  cardMaskedNumber: string;
  dueDate: string;
  totalAmount: number;
  status: 'DUE' | 'PAID' | 'OVERDUE';
}

export interface StatementDetail extends Statement {
  paidAmount: number;
  transactions: Array<{
    id: number;
    approvedAt: string;
    merchantName: string;
    amount: number;
    status: 'APPROVED' | 'CANCELED';
  }>;
}

export interface Approval {
  id: number;
  approvedAt: string;
  merchantName: string;
  cardMaskedNumber: string;
  amount: number;
  status: 'APPROVED' | 'CANCELED';
}

export interface CardItem {
  id: number;
  name: string;
  maskedNumber: string;
  overseasEnabled: boolean;
  reissueStatus: 'NONE' | 'REQUESTED' | 'COMPLETED';
}

export interface PointLedger {
  id: number;
  createdAt: string;
  type: 'EARN' | 'USE' | 'CONVERT';
  amount: number;
  description: string;
}

export interface Inquiry {
  id: number;
  title: string;
  status: 'RECEIVED' | 'IN_PROGRESS' | 'ANSWERED';
  createdAt: string;
  hasAttachment: boolean;
}

export interface DocumentItem {
  id: number;
  name: string;
  status: 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

export interface NotificationItem {
  id: number;
  category: 'NOTICE' | 'MESSAGE';
  title: string;
  read: boolean;
  createdAt: string;
}

export type Paged<T> = PageResponse<T>;
