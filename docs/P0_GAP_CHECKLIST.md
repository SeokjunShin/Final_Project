# P0 갭 체크리스트

작업 기준: MyCard 수동 진단 테스트베드 P0 MVP (No-Docker, VM 직접 배포)

## 1) 백엔드 동작/보안

- [x] `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me` 존재
- [x] Refresh token DB 저장 시 해시값 사용 (`SHA-256 hex`) 및 `revoked_at` 폐기 관리
- [x] `login_attempts`에 성공/실패 + ip + user_agent 기록
- [x] request_id 필터 (`X-Request-ID`) 생성/전파/로그 연동
- [x] 표준 JSON 에러 응답 + 내부 스택 비노출 (`GlobalExceptionHandler`)
- [x] RBAC 문자열 정규화 (`ROLE_` prefix)로 `hasRole` 매칭 안정화
- [x] `/api/dashboard/summary` 동작 경로 확보
- [x] `/api/statements` 목록(필터+페이지) / `/api/statements/{id}` / `/api/statements/{id}/export.csv` 구현
- [x] `/api/inquiries`(GET/POST), `/api/inquiries/{id}`(GET), `/api/inquiries/{id}/replies`(POST) 구현
- [x] 운영자 전용 문의 큐/배정/답변/종료 API (`/api/operator/inquiries/...`) 구현
- [x] 문서 다운로드를 직접 파일 경로 노출 방식에서 권한 검증 API 경유로 변경

## 2) 프론트 정합성

- [x] 사용자 포털 API base `/api` 고정
- [x] 관리자 포털 API base `/api` 고정
- [x] axios interceptor: access 자동 첨부 + 401 refresh 1회 재시도
- [x] 사용자 명세서 목록/상세에서 CSV 다운로드 API 연동
- [x] 사용자 문의 목록/등록 API를 `/api/inquiries`로 정렬
- [x] 관리자 문의 화면을 `/api/operator/inquiries` 플로우로 정렬
- [x] 관리자 로그인 요청 필드를 백엔드(`email/password`)와 일치화

## 3) 인프라/문서 정합성

- [x] `infra/nginx/mycard.conf`, `infra/nginx/admin.conf` 분리
- [x] 정적 배포 경로 명시: `/var/www/mycard/user`, `/var/www/mycard/admin`
- [x] `infra/systemd/mycard-api.service`의 `/etc/mycard/mycard-api.env` 사용 확인
- [x] env 템플릿 키를 `application.yml`과 일치(`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `UPLOAD_PATH`)하도록 수정
- [x] README를 No-Docker 기준으로 재작성
- [x] `docs/NO_DOCKER_RUNBOOK.md`, `docs/P0_API_RBAC_MATRIX.md` 추가

## 4) 남은 리스크

- [ ] 현재 작업 환경에서 JDK 미설치(`JAVA_HOME` 없음)로 백엔드 컴파일/통합 테스트 미실행
- [ ] 프론트 빌드/런타임 검증은 Node 환경에서 `npm run build` 실행 확인 필요
- [ ] 일부 기존 코드(과거 스키마 호환용 transient 필드) 정리는 후속 리팩터링 권장