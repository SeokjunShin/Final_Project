import { adminApiClient } from './client';
import type { AuditLog, Paged, QueueItem } from '@/types';

export const adminApi = {
  dashboard: () => adminApiClient.get('/admin/dashboard').then((r) => r.data),
  inquiries: (params: Record<string, unknown>) =>
    adminApiClient.get<Paged<QueueItem>>('/admin/inquiries', { params }).then((r) => r.data),
  inquiryAnswer: (id: number, answer: string) => adminApiClient.post(`/admin/inquiries/${id}/answer`, { answer }),
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
};
