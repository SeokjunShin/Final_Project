import { apiClient } from './client';
import type {
  Approval,
  CardItem,
  CardApplication,
  CardApplicationRequest,
  DashboardSummary,
  DocumentItem,
  Inquiry,
  LoanCreatePayload,
  LoanDetail,
  LoanListItem,
  NotificationItem,
  Paged,
  PointLedger,
  Statement,
  StatementDetail,
} from '@/types';

export const dashboardApi = {
  getSummary: () => apiClient.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
};

export const statementApi = {
  list: (params: Record<string, unknown>) =>
    apiClient.get<Paged<Statement>>('/statements', { params }).then((r) => r.data),
  detail: (id: number) => apiClient.get<StatementDetail>(`/statements/${id}`).then((r) => r.data),
  downloadCsv: (id: number) =>
    apiClient.get(`/statements/${id}/export.csv`, { responseType: 'blob' }).then((r) => r.data),
};

export const approvalsApi = {
  list: (params: Record<string, unknown>) =>
    apiClient.get<Paged<Approval>>('/approvals', { params }).then((r) => r.data),
};

export const cardsApi = {
  list: () => apiClient.get<CardItem[]>('/cards').then((r) => r.data),
  toggleOverseas: (cardId: number, enabled: boolean) =>
    apiClient.patch(`/cards/${cardId}/overseas`, { enabled }),
  requestReissue: (cardId: number) => apiClient.post(`/cards/${cardId}/reissue`),
};

export const pointsApi = {
  balance: () => apiClient.get<{ totalPoints: number; availablePoints: number; expiringPoints: number; expiringDate: string | null }>('/points/balance').then((r) => r.data),
  ledger: (params: Record<string, unknown>) =>
    apiClient.get<Paged<PointLedger>>('/points/ledger', { params }).then((r) => r.data),
  convert: (points: number, accountId?: number) => 
    apiClient.post('/points/convert', { points, accountId }).then((r) => r.data),
  withdrawals: (params: Record<string, unknown>) =>
    apiClient.get('/points/withdrawals', { params }).then((r) => r.data),
};

// 은행 계좌 API
export const bankAccountApi = {
  getBankCodes: () => 
    apiClient.get<{ code: string; name: string }[]>('/bank-accounts/banks').then((r) => r.data),
  list: () => 
    apiClient.get<BankAccount[]>('/bank-accounts').then((r) => r.data),
  add: (payload: { bankCode: string; accountNumber: string; accountHolder: string; setAsDefault?: boolean }) =>
    apiClient.post<BankAccount>('/bank-accounts', payload).then((r) => r.data),
  delete: (accountId: number) => 
    apiClient.delete(`/bank-accounts/${accountId}`),
  setDefault: (accountId: number) =>
    apiClient.put<BankAccount>(`/bank-accounts/${accountId}/default`).then((r) => r.data),
};

// 타입 정의
export interface BankAccount {
  id: number;
  bankCode: string;
  bankName: string;
  accountNumberMasked: string;
  accountHolder: string;
  isVerified: boolean;
  isDefault: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

export const supportApi = {
  list: (params: Record<string, unknown>) => apiClient.get<Paged<Inquiry>>('/inquiries', { params }).then((r) => r.data),
  detail: (id: number) => apiClient.get<Inquiry>(`/inquiries/${id}`).then((r) => r.data),
  create: (payload: { category: string; title: string; content: string }) => apiClient.post('/inquiries', payload),
  reply: (id: number, content: string) => apiClient.post(`/inquiries/${id}/replies`, { content }),
};

export const docsApi = {
  list: () => apiClient.get<DocumentItem[]>('/docs').then((r) => r.data),
  upload: (form: FormData) => apiClient.post('/docs', form),
  download: (documentId: number, fileName: string) => {
    return apiClient.get(`/documents/${documentId}/download`, { responseType: 'blob' }).then((r) => {
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },
};

export const notificationsApi = {
  list: () => apiClient.get<NotificationItem[]>('/notifications').then((r) => r.data),
  read: (id: number) => apiClient.patch(`/notifications/${id}/read`),
};

// 카드 신청 API
export const cardApplicationApi = {
  list: () => apiClient.get<CardApplication[]>('/card-applications').then((r) => r.data),
  detail: (id: number) => apiClient.get<CardApplication>(`/card-applications/${id}`).then((r) => r.data),
  create: (payload: CardApplicationRequest) =>
    apiClient.post<CardApplication>('/card-applications', payload).then((r) => r.data),
  cancel: (id: number) => apiClient.delete(`/card-applications/${id}`),
};

export const loansApi = {
  list: (params: Record<string, unknown>) =>
    apiClient.get<Paged<LoanListItem>>('/loans', { params }).then((r) => r.data),
  detail: (id: number) => apiClient.get<LoanDetail>(`/loans/${id}`).then((r) => r.data),
  create: (payload: LoanCreatePayload) =>
    apiClient.post<LoanListItem>('/loans', payload).then((r) => r.data),
};
