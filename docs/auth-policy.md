# Auth Policy

## Token Policy

- Access Token: 15분
- Refresh Token: 7일
- Refresh Token 저장: DB `refresh_tokens.token_hash` (SHA-256 hex)
- 재발급 시 기존 refresh는 `revoked_at` 업데이트 후 폐기

## Login / Logout

- 로그인 성공/실패는 `login_attempts`에 저장
  - `email`, `user_id`, `ip`, `user_agent`, `success`, `created_at`
- 로그아웃 시 해당 refresh token 폐기

## Account Lock (설계)

- 실패 횟수 누적 시 잠금 정책 적용 가능
- 잠금 해제는 시간 경과 또는 관리자 조치

## Re-authentication Policy

민감 변경은 재인증이 필요하다.

- 내 정보 수정: `current_password` 필수
- 비밀번호 변경: `current_password` 필수
- 2FA 설정 변경: `current_password` 필수

## Logging Rules

- 토큰 원문/비밀번호는 로그에 기록하지 않음
- 외부 응답에는 표준 JSON 에러만 제공
- 내부 스택 트레이스는 서버 로그에만 저장
- `X-Request-ID` 기반 요청 상관관계 유지
