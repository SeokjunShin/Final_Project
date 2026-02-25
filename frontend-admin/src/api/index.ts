import { adminApiClient } from './client';
import type { AuditLog, CardApplication, Paged, QueueItem } from '@/types';

export const adminApi = {
  dashboard: () => adminApiClient.get('/admin/dashboard').then((r) => r.data),
  inquiries: (params: Record<string, unknown>) =>
    adminApiClient.get<Paged<QueueItem>>('/operator/inquiries', { params }).then((r) => r.data),
  inquiryDetail: (id: number) => adminApiClient.get(`/operator/inquiries/${id}`).then((r) => r.data),
  inquiryAssign: (id: number) => adminApiClient.post(`/operator/inquiries/${id}/assign`),
  inquiryAnswer: (id: number, answer: string) => adminApiClient.post(`/operator/inquiries/${id}/replies`, { content: answer }),
  inquiryResolve: (id: number) => adminApiClient.post(`/operator/inquiries/${id}/resolve`),
  documents: (params: Record<string, unknown>) =>
    adminApiClient.get<Paged<QueueItem>>('/admin/documents', { params }).then((r) => r.data),
  documentTransition: (id: number, status: 'APPROVED' | 'REJECTED') =>
    adminApiClient.patch(`/admin/documents/${id}/status`, { status }),
  sendMessage: (payload: { userId: string; content: string }) => adminApiClient.post('/admin/messages', payload),
  messages: () => adminApiClient.get('/admin/messages').then((r) => r.data),
  users: () => adminApiClient.get('/admin/users').then((r) => r.data),
  updateUserState: (userId: number, state: string) => adminApiClient.patch(`/admin/users/${userId}/state`, { state }),
  merchants: () => adminApiClient.get('/admin/merchants').then((r) => r.data),
  saveMerchant: (payload: Record<string, unknown>) => adminApiClient.post('/admin/merchants', payload),
  events: () => adminApiClient.get('/admin/events').then((r) => r.data),
  drawWinners: (eventId: number) => adminApiClient.post(`/admin/events/${eventId}/draw`),
  pointPolicy: () => adminApiClient.get('/admin/policies/points').then((r) => r.data),
  savePointPolicy: (payload: Record<string, unknown>) => adminApiClient.put('/admin/policies/points', payload),
  auditLogs: (params: Record<string, unknown>) =>
    adminApiClient.get<Paged<AuditLog>>('/admin/audit-logs', { params }).then((r) => r.data),

  // 카드 신청 관리
  cardApplications: (params: Record<string, unknown>) =>
    adminApiClient.get<Paged<CardApplication>>('/admin/card-applications', { params }).then((r) => r.data),
  cardApplicationDetail: (id: number) =>
    adminApiClient.get<CardApplication>(`/admin/card-applications/${id}`).then((r) => r.data),
  approveCardApplication: (id: number, creditLimit: number) =>
    adminApiClient.post<CardApplication>(`/admin/card-applications/${id}/approve`, null, { params: { creditLimit } }).then((r) => r.data),
  rejectCardApplication: (id: number, reason: string) =>
    adminApiClient.post<CardApplication>(`/admin/card-applications/${id}/reject`, null, { params: { reason } }).then((r) => r.data),
  startReview: (id: number) =>
    adminApiClient.post<CardApplication>(`/admin/card-applications/${id}/start-review`).then((r) => r.data),
  pendingApplicationCount: () =>
    adminApiClient.get<{ count: number }>('/admin/card-applications/pending-count').then((r) => r.data),
};
