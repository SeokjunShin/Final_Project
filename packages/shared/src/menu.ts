import type { Role } from './types';

export interface MenuItemDef {
  label: string;
  path: string;
  roles: Role[];
}

export const userMenu: MenuItemDef[] = [
  { label: '대시보드', path: '/dashboard', roles: ['USER'] },
  { label: '이용대금 명세서', path: '/statements', roles: ['USER'] },
  { label: '승인/취소 내역', path: '/approvals', roles: ['USER'] },
  { label: '카드관리', path: '/cards', roles: ['USER'] },
  { label: '포인트', path: '/points', roles: ['USER'] },
  { label: '고객센터', path: '/support/inquiries', roles: ['USER'] },
  { label: '문서함', path: '/docs', roles: ['USER'] },
  { label: '알림센터', path: '/notifications', roles: ['USER'] },
];

export const adminMenu: MenuItemDef[] = [
  { label: '운영 대시보드', path: '/dashboard', roles: ['OPERATOR', 'ADMIN'] },
  { label: '문의 큐', path: '/inquiries', roles: ['OPERATOR', 'ADMIN'] },
  { label: '문서 검토', path: '/documents', roles: ['OPERATOR', 'ADMIN'] },
  { label: '메시지 발송', path: '/messages', roles: ['OPERATOR', 'ADMIN'] },
  { label: '사용자 관리', path: '/users', roles: ['ADMIN'] },
  { label: '가맹점 관리', path: '/merchants', roles: ['ADMIN'] },
  { label: '이벤트 관리', path: '/events', roles: ['ADMIN'] },
  { label: '포인트 정책', path: '/policies/points', roles: ['ADMIN'] },
  { label: '감사로그', path: '/audit-logs', roles: ['ADMIN'] },
];
