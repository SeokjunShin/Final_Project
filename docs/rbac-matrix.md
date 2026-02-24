# RBAC Matrix

## Role Definitions

- `USER`: 일반 고객
- `OPERATOR`: 상담원
- `ADMIN`: 관리자

## Domain Policy

- 사용자 포털: `mycard.local`
- 관리자 포털: `admin.mycard.local`
- 관리자 기능(`ADMIN/OPERATOR`)은 admin 포털에서만 사용하도록 UI 라우팅 분리

## API Authorization Matrix

| API | USER | OPERATOR | ADMIN | Owner Check |
|---|---|---|---|---|
| `POST /api/auth/login` | O | O | O | - |
| `POST /api/auth/refresh` | O | O | O | - |
| `POST /api/auth/logout` | O | O | O | - |
| `GET /api/auth/me` | O | O | O | - |
| `GET /api/me` | O | X | X | self |
| `PATCH /api/me` | O | X | X | self + current_password |
| `POST /api/me/password` | O | X | X | self + current_password |
| `POST /api/me/security` | O | X | X | self + current_password |
| `GET /api/dashboard/summary` | O | O | O | self scope |
| `GET /api/statements` | O | O | O | list scope |
| `GET /api/statements/{id}` | O | O | O | yes |
| `GET /api/statements/{id}/export.csv` | O | O | O | yes |
| `GET /api/approvals` | O | O | O | list scope |
| `GET /api/inquiries` | O | O | O | self scope |
| `POST /api/inquiries` | O | O | O | self |
| `GET /api/inquiries/{id}` | O | O | O | yes |
| `POST /api/inquiries/{id}/replies` | O | O | O | yes |
| `GET /api/operator/inquiries` | X | O | O | queue policy |
| `POST /api/operator/inquiries/{id}/assign` | X | O | O | operator policy |
| `POST /api/operator/inquiries/{id}/resolve` | X | O | O | assigned operator/admin |
| `GET /api/files/{attachmentId}/download` | O | O | O | `requireAttachmentAccess` |
| `GET /api/documents/{id}/download` | O | O | O | owner/staff/public |
| `/api/admin/**` | X | X | O | endpoint policy |

## Method Security Pattern

- 컨트롤러: `@PreAuthorize("hasRole('ADMIN')")`, `@PreAuthorize("hasAnyRole('OPERATOR','ADMIN')")`
- 객체 권한: 서비스 레이어 `loadAndAuthorizeXxx(principal,id)`
- 공통 유틸: `OwnerCheckService`
  - `requireUserRole`
  - `requireOperatorOrAdmin`
  - `requireOwner`
  - `requireAttachmentAccess`
