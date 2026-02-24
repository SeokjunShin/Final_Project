# P0 API 목록 / 권한 매트릭스

## 공통

- 인증 헤더: `Authorization: Bearer <access_token>`
- 토큰 재발급: `POST /api/auth/refresh`
- 401 발생 시 프론트 인터셉터에서 refresh 1회 재시도

## 엔드포인트별 권한

| API | USER | OPERATOR | ADMIN | 비고 |
|---|---|---|---|---|
| `POST /api/auth/login` | O | O | O | 로그인 |
| `POST /api/auth/refresh` | O | O | O | refresh token 필요 |
| `POST /api/auth/logout` | O | O | O | 세션 종료 |
| `GET /api/auth/me` | O | O | O | 현재 사용자 |
| `GET /api/dashboard/summary` | O | O | O | 본인 요약 |
| `GET /api/statements` | O | O | O | USER는 본인 데이터, staff는 owner-check 우회 가능 |
| `GET /api/statements/{id}` | O | O | O | owner-check 필수 |
| `GET /api/statements/{id}/export.csv` | O | O | O | owner-check 필수 |
| `GET /api/inquiries` | O | O | O | USER는 본인 문의 목록 |
| `POST /api/inquiries` | O | O | O | 문의 등록 |
| `GET /api/inquiries/{id}` | O | O | O | owner/staff만 접근 |
| `POST /api/inquiries/{id}/replies` | O | O | O | owner/staff만 작성 |
| `GET /api/operator/inquiries` | X | O | O | 문의 큐 |
| `GET /api/operator/inquiries/{id}` | X | O | O | 문의 상세 |
| `POST /api/operator/inquiries/{id}/assign` | X | O | O | 배정 |
| `POST /api/operator/inquiries/{id}/replies` | X | O | O | 운영자 답변 |
| `POST /api/operator/inquiries/{id}/resolve` | X | O | O | 상태 종료 |
| `GET /api/documents/{id}/download` | O | O | O | 문서 소유자/공개/staff만 다운로드 |
| `GET /api/files/{attachmentId}/download` | O | O | O | 첨부 owner-check 필수 |

## Owner-check 대상

- 명세서(`statements`)
- 문의(`inquiries`)
- 첨부(`files`, `documents`)

## 에러 응답

표준 JSON 포맷:

```json
{
  "status": 403,
  "code": "ACCESS_DENIED",
  "message": "접근 권한이 없습니다.",
  "path": "/api/..."
}
```

- 스택트레이스/민감정보는 응답에 포함하지 않음