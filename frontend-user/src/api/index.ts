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
  convert: (amount: number) => apiClient.post('/points/convert', { amount }),
};

export const supportApi = {
  list: (params: Record<string, unknown>) => apiClient.get<Paged<Inquiry>>('/inquiries', { params }).then((r) => r.data),
  detail: (id: number) => apiClient.get<Inquiry>(`/inquiries/${id}`).then((r) => r.data),
  create: (payload: { category: string; title: string; content: string }) => apiClient.post('/inquiries', payload),
  reply: (id: number, content: string) => apiClient.post(`/inquiries/${id}/replies`, { content }),
};

export const docsApi = {
  list: () => apiClient.get<DocumentItem[]>('/docs').then((r) => r.data),
  upload: (form: FormData) => apiClient.post('/docs', form),
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
