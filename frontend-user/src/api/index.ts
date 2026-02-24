import { apiClient } from './client';
import type {
  Approval,
  CardItem,
  DashboardSummary,
  DocumentItem,
  Inquiry,
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
  downloadCsv: (params: Record<string, unknown>) =>
    apiClient.get('/statements/export', { params, responseType: 'blob' }).then((r) => r.data),
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
  balance: () => apiClient.get<{ balance: number }>('/points/balance').then((r) => r.data),
  ledger: (params: Record<string, unknown>) =>
    apiClient.get<Paged<PointLedger>>('/points/ledger', { params }).then((r) => r.data),
  convert: (amount: number) => apiClient.post('/points/convert', { amount }),
};

export const supportApi = {
  list: () => apiClient.get<Inquiry[]>('/support/inquiries').then((r) => r.data),
  detail: (id: number) => apiClient.get<Inquiry>(`/support/inquiries/${id}`).then((r) => r.data),
  create: (form: FormData) => apiClient.post('/support/inquiries', form),
};

export const docsApi = {
  list: () => apiClient.get<DocumentItem[]>('/docs').then((r) => r.data),
  upload: (form: FormData) => apiClient.post('/docs', form),
};

export const notificationsApi = {
  list: () => apiClient.get<NotificationItem[]>('/notifications').then((r) => r.data),
  read: (id: number) => apiClient.patch(`/notifications/${id}/read`),
};
