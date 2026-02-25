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

// 카드 신청 (관리자용)
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
  annualIncome?: string; // 관리자만 볼 수 있음
  cardType: string;
  cardProduct: string;
  requestedCreditLimit?: number;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED';
  reviewedAt?: string;
  rejectionReason?: string;
  approvedCreditLimit?: number;
  adminNotes?: string;
  userName?: string;
  userEmail?: string;
  reviewerName?: string;
  issuedCardId?: number;
  issuedCardNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export type Paged<T> = PageResponse<T>;

// 대출 (관리자 현황 - 백엔드 /loans API 동일)
export type LoanType = 'CASH_ADVANCE' | 'CARD_LOAN';
export type LoanStatus = 'REQUESTED' | 'APPROVED' | 'DISBURSED' | 'REPAID' | 'CANCELED';
export interface LoanListItem {
  id: number;
  loanType: LoanType;
  principalAmount: number;
  status: LoanStatus;
  requestedAt: string;
  userId?: number;
  userName?: string;
}
export interface LoanDetail extends LoanListItem {
  interestRate: number;
  termMonths: number | null;
  approvedAt: string | null;
  disbursedAt: string | null;
  repaidAt: string | null;
  canceledAt: string | null;
}
