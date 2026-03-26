# 공통 에러 페이지 조치 이행 점검 정리

## 1. 요구사항

- `400`, `401`, `403`, `404`, `500` 등 주요 에러 코드에 대해 단일 공통 페이지로 리다이렉션 처리할 것
- 공통 에러 페이지에는 상태 코드, 서버 버전 정보, 시스템 경로 등 불필요한 정보를 노출하지 않을 것
- 사용자에게는 `요청하신 페이지를 처리할 수 없습니다.` 수준의 최소 안내 문구만 제공할 것

## 2. 조치 이행 비교

| 대응 방안 | 이행 여부 | 점검 결과 |
| --- | --- | --- |
| 모든 주요 에러 코드를 단일 공통 페이지로 리다이렉션 | 이행 완료 | 사용자 포털과 관리자 포털 모두 `/error` 공통 페이지로 통합하였다. |
| 공통 페이지에 상태 코드, 경로, 상세 에러 메시지 미노출 | 이행 완료 | 공통 페이지에는 최소 안내 문구와 이동 버튼만 표시하도록 변경하였다. |
| 백엔드 응답에서도 불필요한 경로/상태 노출 최소화 | 이행 완료 | API 에러 응답에서 `path`, `status` 등 사용자 노출 정보 제거 및 기본 에러 처리 최소화 설정을 적용하였다. |

## 3. 전체 수정 내용

### 3.1 사용자 포털

- `CommonErrorPage` 신설
- `400/401/403/404/500` 응답 시 `/error`로 리다이렉트하도록 Axios 인터셉터 수정
- React 런타임 에러 발생 시에도 공통 페이지가 보이도록 `ErrorBoundary` 추가
- 기존 `403`, `404` 라우트를 공통 에러 페이지로 통합

### 3.2 관리자 포털

- 사용자 포털과 동일하게 공통 에러 페이지 추가
- 관리자 API 클라이언트의 전역 에러 리다이렉트 적용
- 권한 부족 시 `/403` 대신 `/error`로 이동하도록 변경
- 관리자 `ErrorBoundary`가 상세 오류 메시지 대신 공통 페이지를 렌더링하도록 변경

### 3.3 백엔드

- `ErrorResponse`에서 사용자 노출용 `status`, `path` 필드 제거
- 예외 응답 메시지를 공통 최소 문구로 통일
- `NoHandlerFoundException`, `HttpRequestMethodNotSupportedException` 처리 추가
- `application.yml`에 기본 에러 노출 최소화 설정 추가

## 4. 적용 방식

### 4.1 공통 에러 페이지 통합

프론트엔드에서 상태 코드별 개별 페이지를 유지하지 않고, `/error` 단일 페이지로 통합하였다.

- 기존: `403`, `404` 각각 별도 페이지
- 변경 후: 모든 주요 오류는 `/error` 한 곳으로 이동

### 4.2 전역 리다이렉트 처리

사용자/관리자 API 클라이언트의 응답 인터셉터에서 아래 상태 코드를 감지하면 공통 페이지로 이동하도록 적용하였다.

- `400`
- `401`
- `403`
- `404`
- `500`

### 4.3 정보 노출 최소화

공통 에러 페이지에는 아래 정보를 표시하지 않도록 하였다.

- HTTP 상태 코드
- 예외 메시지 원문
- 서버 내부 경로
- 스택 트레이스
- 서버/프레임워크 버전 정보

## 5. 수정 파일

### 프론트엔드 사용자 포털

- `frontend-user/src/pages/errors/CommonErrorPage.tsx`
- `frontend-user/src/components/ErrorBoundary.tsx`
- `frontend-user/src/utils/errorRedirect.ts`
- `frontend-user/src/api/client.ts`
- `frontend-user/src/routes/router.tsx`
- `frontend-user/src/main.tsx`

### 프론트엔드 관리자 포털

- `frontend-admin/src/pages/errors/CommonErrorPage.tsx`
- `frontend-admin/src/components/ErrorBoundary.tsx`
- `frontend-admin/src/utils/errorRedirect.ts`
- `frontend-admin/src/api/client.ts`
- `frontend-admin/src/routes/router.tsx`
- `frontend-admin/src/routes/guards.tsx`
- `frontend-admin/src/App.tsx`

### 백엔드

- `backend/src/main/java/com/mycard/api/dto/ErrorResponse.java`
- `backend/src/main/java/com/mycard/api/exception/GlobalExceptionHandler.java`
- `backend/src/main/java/com/mycard/api/security/JwtAuthenticationEntryPoint.java`
- `backend/src/main/resources/application.yml`

## 6. 재점검 기준

### 사용자 포털

- 존재하지 않는 경로 접근 시 `/error` 공통 페이지로 이동해야 함
- API `400/401/403/404/500` 응답 발생 시 상태 코드별 화면 대신 `/error` 페이지로 이동해야 함
- 공통 페이지에 상태 코드나 시스템 경로가 표시되지 않아야 함

### 관리자 포털

- 권한 없는 메뉴 접근 시 `/error` 페이지로 이동해야 함
- 로그인 이후 API 오류 발생 시 상세 에러 화면이 아니라 공통 페이지가 표시되어야 함

### 백엔드

- API 오류 응답 본문에 사용자 노출용 `path`, `status`, 스택 트레이스가 포함되지 않아야 함
- 정의되지 않은 엔드포인트 접근 시 기본 에러 페이지 대신 최소 정보 응답이 반환되어야 함

## 7. 최종 판단

본 조치는 요구사항에 따라 사용자 및 관리자 화면의 오류 노출 방식을 단일 공통 페이지로 통합하였고, 화면 및 API 응답에서 불필요한 기술 정보를 최소화하도록 보완하였다.

따라서 아래 항목은 충족된 것으로 판단할 수 있다.

- 단일 공통 에러 페이지 리다이렉트 적용
- 상태 코드/시스템 경로/상세 에러 메시지 미노출
- 사용자 최소 안내 문구만 제공
