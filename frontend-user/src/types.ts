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
  upcomingPayment: number;
  totalAvailableLimit: number;
  pointBalance: number;
  recentApprovals: Approval[];
  monthlySpend?: { month: string; amount: number }[];
}

export interface Statement {
  id: number;
  year: number;
  month: number;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: 'DRAFT' | 'ISSUED' | 'PAID';
}

export interface StatementDetail extends Statement {
  items: Array<{
    id: number;
    transactionDate: string;
    merchantName: string;
    categoryName: string;
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
  category: string;
  title: string;
  content?: string;
  status: 'OPEN' | 'ASSIGNED' | 'ANSWERED' | 'CLOSED';
  createdAt: string;
  replies?: Array<{
    id: number;
    content: string;
    authorName: string;
    isStaffReply: boolean;
    createdAt: string;
  }>;
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

// 카드 신청 요청
export interface CardApplicationRequest {
  fullName: string;
  ssn: string;
  phone: string;
  email: string;
  address: string;
  addressDetail?: string;
  employmentType: string;
  employerName?: string;
  jobTitle?: string;
  annualIncome: string;
  cardType: string;
  cardProduct: string;
  requestedCreditLimit?: number;
}

// 카드 신청 응답
export interface CardApplication {
  id: number;
  fullName: string;
  maskedSsn: string;
  phone: string;
  email: string;
  address: string;
  addressDetail?: string;
  employmentType: string;
  employerName?: string;
  jobTitle?: string;
  cardType: string;
  cardProduct: string;
  requestedCreditLimit?: number;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED';
  reviewedAt?: string;
  rejectionReason?: string;
  approvedCreditLimit?: number;
  issuedCardNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export type Paged<T> = PageResponse<T>;
