# `/dashboard` 마이페이지 2차 인증 우회 취약점 조치 이행 점검 정리

## 1. 점검 대상

- 대상 URL: `/dashboard`
- 대상 기능: 마이페이지 진입 시 2차 비밀번호 인증
- 취약점 유형: 클라이언트 측 2차 인증 우회

## 2. 기존 취약점 진단 결과 요약

기존 구조는 사용자 포털에서 마이페이지 레이아웃과 하위 페이지가 먼저 렌더링된 후, 그 위에 2차 비밀번호 입력 모달을 띄우는 방식이었다.

- `UserLayout`이 먼저 `<Outlet />`을 마운트하여 대시보드, 카드, 포인트, 내정보 등의 하위 페이지가 즉시 렌더링되었다.
- 각 페이지의 `React Query` 또는 API 호출이 2차 인증 완료 이전에도 실행될 수 있었다.
- 2차 인증 완료 여부는 `sessionStorage`의 `second_auth_passed` 값만으로 관리되고 있어, 서버는 해당 세션이 실제로 2차 인증을 통과했는지 알 수 없었다.
- 따라서 Burp Suite 등으로 브라우저 요청을 가로채거나 직접 API를 호출하면 `/api/auth/me`, `/api/dashboard/summary` 등 민감 API가 2차 인증 이전에도 호출 가능한 구조였다.

## 3. 최초 대응 방안과 조치 이행 비교

| 대응 방안 | 이행 여부 | 점검 결과 |
| --- | --- | --- |
| 1. 마이페이지 접근 시 2차 인증 완료 여부를 서버에서 검증할 것 | 이행 완료 | access token과 refresh token 세션에 2차 인증 상태를 연계하고, 민감 API 요청 시 서버 필터에서 미완료 세션을 차단하도록 변경하였다. |
| 2. 2차 인증 완료 전에는 `/api/auth/me` 및 마이페이지 API 접근을 차단할 것 | 이행 완료 | `/auth/me`, `/dashboard/**`, `/me/**`, `/cards/**`, `/points/**` 등 마이페이지 관련 API를 `SECOND_AUTH_REQUIRED` 응답으로 차단하도록 적용하였다. |
| 3. 2차 인증 완료 전에는 민감 페이지가 먼저 렌더링되지 않도록 프론트엔드를 보완할 것 | 이행 완료 | `UserLayout`에서 2차 인증 전에는 `<Outlet />`을 마운트하지 않도록 변경하여 하위 페이지의 선행 데이터 조회를 차단하였다. |

## 4. 전체 수정 내용

### 4.1 서버 세션 기반 2차 인증 상태 관리 추가

기존에는 2차 인증 완료 여부가 브라우저 `sessionStorage`에만 존재했고, 서버는 이를 전혀 검증하지 못했다.  
현재는 refresh token 세션 단위로 `session_id`, `second_auth_verified` 값을 저장하도록 변경하였다.

- 로그인 시
  - 새 `session_id` 발급
  - access token에는 `sessionId`, `secondAuthVerified=false` 클레임 포함
  - refresh token에도 동일 `sessionId` 포함
  - DB `refresh_tokens` 테이블에 세션 상태 저장
- 2차 인증 성공 시
  - 현재 세션의 `second_auth_verified=true`로 업데이트
  - `secondAuthVerified=true`가 반영된 새 access token 재발급
- refresh token 재발급 시
  - 기존 세션의 2차 인증 상태를 유지한 채 새 access token / refresh token 발급

### 4.2 서버 측 민감 API 차단 추가

`SecondAuthEnforcementFilter`를 추가하여, 일반 사용자(USER)의 민감 API 요청은 2차 인증이 완료되지 않으면 서버에서 직접 차단하도록 변경하였다.

차단 대상 예시는 다음과 같다.

- `/auth/me`
- `/dashboard/**`
- `/me/**`
- `/statements/**`
- `/approvals/**`
- `/cards/**`
- `/card-applications/**`
- `/points/**`
- `/bank-accounts/**`
- `/inquiries/**`
- `/docs/**`
- `/documents/**`
- `/messages/**`
- `/loans/**`

차단 시 응답 코드는 `403 Forbidden`이며, 응답 본문에는 `SECOND_AUTH_REQUIRED` 코드와 최소한의 안내 문구만 포함되도록 처리하였다.

### 4.3 프론트엔드 선행 렌더링 차단

기존에는 `UserLayout`이 먼저 `<Outlet />`을 렌더링하고 그 후 2차 인증 다이얼로그가 열렸다.  
현재는 2차 인증 완료 전에는 `<Outlet />` 자체를 마운트하지 않도록 변경하였다.

이로 인해 `/dashboard`, `/my/profile`, `/cards`, `/points` 등 마이페이지 하위 페이지의 `useQuery()`가 2차 인증 전에는 실행되지 않는다.

### 4.4 `/auth/me` 선행 호출 차단

기존 `AuthContext`는 access token만 있으면 앱 시작 시 무조건 `/auth/me`를 호출하였다.  
현재는 `second_auth_passed` 상태가 없는 경우 `/auth/me`를 호출하지 않고, 로그인 시 저장된 캐시 사용자 정보만 사용하도록 변경하였다.

이로 인해 페이지 진입 직후 `/auth/me`가 선행 호출되어 마이페이지 정보가 노출되는 문제가 제거되었다.

### 4.5 프론트 인터셉터 예외 처리 보완

서버가 `SECOND_AUTH_REQUIRED`를 반환할 때 기존 공통 에러 페이지(`/error`)로 바로 이동하면 사용성이 깨지므로, 프론트의 axios 인터셉터에서 이 코드에 대해 예외 처리하였다.

- `SECOND_AUTH_REQUIRED` 수신 시
  - `second_auth_passed` 상태 초기화
  - 공통 에러 페이지로 리다이렉트하지 않음
  - 레이아웃에서 다시 2차 인증 모달이 뜨도록 상태 동기화

## 5. 적용 방식

### 5.1 서버 사이드 2차 인증 검증 방식

본 조치에서는 "모달이 떠 있었는지"가 아니라 "현재 서버 세션이 실제로 2차 인증을 통과했는지"를 기준으로 접근을 제어하도록 변경하였다.

- 변경 전
  - 프론트 `sessionStorage` 값만 신뢰
  - 서버는 2차 인증 완료 여부를 모름
- 변경 후
  - JWT access token 클레임 + `refresh_tokens` 테이블 세션 상태로 검증
  - 서버 필터가 민감 API 요청 자체를 거부

### 5.2 `/api/auth/me` 접근 차단 방식

`/auth/me`는 로그인 직후 사용자 정보를 복구하는 용도로 사용되지만, 마이페이지 보안 요구사항상 2차 인증 이전에는 접근이 허용되면 안 된다.  
따라서 서버 필터에서 `/auth/me`를 2차 인증 필요 API로 포함하였고, 프론트에서도 2차 인증 전에는 해당 호출을 아예 하지 않도록 수정하였다.

### 5.3 민감 페이지 선행 렌더링 차단 방식

`UserLayout`에서 2차 인증 완료 여부가 false일 때는 `<Outlet />`을 렌더링하지 않는다.  
즉, 페이지가 "보여진 뒤 모달이 뜨는" 구조가 아니라 "모달 인증이 끝나야 페이지가 마운트되는" 구조로 바뀌었다.

## 6. 수정 파일

### 백엔드

- `backend/src/main/java/com/mycard/api/config/SecurityConfig.java`
- `backend/src/main/java/com/mycard/api/controller/AuthController.java`
- `backend/src/main/java/com/mycard/api/dto/auth/VerifySecondPasswordResponse.java`
- `backend/src/main/java/com/mycard/api/entity/RefreshToken.java`
- `backend/src/main/java/com/mycard/api/repository/RefreshTokenRepository.java`
- `backend/src/main/java/com/mycard/api/security/JwtAuthenticationFilter.java`
- `backend/src/main/java/com/mycard/api/security/JwtTokenProvider.java`
- `backend/src/main/java/com/mycard/api/security/SecondAuthEnforcementFilter.java`
- `backend/src/main/java/com/mycard/api/security/UserPrincipal.java`
- `backend/src/main/java/com/mycard/api/service/AuthService.java`
- `backend/src/main/resources/db/migration/V37__add_second_auth_state_to_refresh_tokens.sql`
- `backend/build.gradle`

### 백엔드 테스트

- `backend/src/test/java/com/mycard/api/security/JwtTokenProviderTest.java`
- `backend/src/test/java/com/mycard/api/security/SecondAuthEnforcementFilterTest.java`

### 프론트엔드

- `frontend-user/src/api/auth.ts`
- `frontend-user/src/api/client.ts`
- `frontend-user/src/api/index.ts`
- `frontend-user/src/components/common/SecondAuthDialog.tsx`
- `frontend-user/src/components/layout/UserLayout.tsx`
- `frontend-user/src/contexts/AuthContext.tsx`
- `frontend-user/src/utils/secondAuth.ts`

### 문서

- `docs/dashboard-second-auth-remediation.md`

## 7. 파일별 수정 전 / 수정 후 코드 비교

### 7.1 `frontend-user/src/components/layout/UserLayout.tsx`

#### 수정 전

```tsx
<Box component="main">
  <Outlet />
</Box>

<Dialog open={!isSecondAuthPassed}>
  ...
</Dialog>
```

#### 수정 후

```tsx
<Box component="main">
  {isSecondAuthPassedState ? (
    <Outlet />
  ) : (
    <Box sx={{ minHeight: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography color="text.secondary">
        2차 비밀번호 인증 후 마이페이지 내용을 확인할 수 있습니다.
      </Typography>
    </Box>
  )}
</Box>

<Dialog open={!isSecondAuthPassedState}>
  ...
</Dialog>
```

#### 핵심 변경 사항

- 2차 인증 완료 전에는 하위 페이지 자체를 마운트하지 않도록 변경
- 페이지 렌더링 후 모달이 뜨는 구조 제거

### 7.2 `frontend-user/src/contexts/AuthContext.tsx`

#### 수정 전

```tsx
if (!token) {
  setReady(true);
  return;
}

authApi.me()
  .then((profile) => setUser(profile))
  .finally(() => setReady(true));
```

#### 수정 후

```tsx
if (!token) {
  setReady(true);
  return;
}
if (!isSecondAuthPassed()) {
  setReady(true);
  return;
}

authApi.me()
  .then((profile) => setUser(profile))
  .finally(() => setReady(true));
```

#### 핵심 변경 사항

- 2차 인증 전 `/auth/me` 자동 호출 차단
- 앱 시작 직후 사용자 정보 우회 조회 방지

### 7.3 `backend/src/main/java/com/mycard/api/security/SecondAuthEnforcementFilter.java`

#### 수정 전

```java
// 관련 필터 없음
// 인증만 되면 민감 API 접근 가능
```

#### 수정 후

```java
if (!userPrincipal.isUser() || userPrincipal.isStaff()) {
    filterChain.doFilter(request, response);
    return;
}

if (userPrincipal.isSecondAuthVerified()) {
    filterChain.doFilter(request, response);
    return;
}

writeForbiddenResponse(response);
```

#### 핵심 변경 사항

- 사용자 세션의 2차 인증 완료 여부를 서버에서 직접 강제
- Burp 등으로 프론트를 우회해도 API 단계에서 차단

### 7.4 `backend/src/main/java/com/mycard/api/security/JwtTokenProvider.java`

#### 수정 전

```java
return Jwts.builder()
        .subject(String.valueOf(userPrincipal.getId()))
        .claim("username", userPrincipal.getUsername())
        .claim("roles", roles)
        .issuedAt(now)
        .expiration(expiryDate)
        .signWith(secretKey)
        .compact();
```

#### 수정 후

```java
return Jwts.builder()
        .subject(String.valueOf(userPrincipal.getId()))
        .claim("username", userPrincipal.getUsername())
        .claim("roles", roles)
        .claim("sessionId", sessionId)
        .claim("secondAuthVerified", secondAuthVerified)
        .issuedAt(now)
        .expiration(expiryDate)
        .signWith(secretKey)
        .compact();
```

#### 핵심 변경 사항

- access token에 세션 ID와 2차 인증 상태 클레임 추가
- 서버가 현재 요청 토큰만으로도 세션 상태를 판별 가능

### 7.5 `backend/src/main/java/com/mycard/api/entity/RefreshToken.java`

#### 수정 전

```java
private String tokenHash;
private LocalDateTime expiresAt;
private LocalDateTime revokedAt;
```

#### 수정 후

```java
private String sessionId;
private String tokenHash;
private boolean secondAuthVerified;
private LocalDateTime expiresAt;
private LocalDateTime revokedAt;
```

#### 핵심 변경 사항

- refresh token 세션 단위로 2차 인증 상태 저장
- access token 재발급 시에도 기존 인증 상태 유지 가능

### 7.6 `backend/src/main/java/com/mycard/api/service/AuthService.java`

#### 수정 전

```java
String accessToken = tokenProvider.generateAccessToken(userPrincipal);
String refreshToken = tokenProvider.generateRefreshToken(userPrincipal.getId());
saveRefreshToken(userPrincipal.getId(), refreshToken, ipAddress, userAgent);
```

#### 수정 후

```java
SessionTokens sessionTokens = issueSessionTokens(userPrincipal, ipAddress, userAgent, false);
...
String accessToken = markSecondAuthVerified(user);
```

#### 핵심 변경 사항

- 로그인 시 미인증 세션 토큰 발급
- 2차 인증 성공 시 인증 완료 상태를 세션에 반영하고 access token 재발급
- refresh 시에도 기존 세션의 인증 상태 유지

### 7.7 `frontend-user/src/api/client.ts`

#### 수정 전

```ts
if (shouldRedirectToCommonErrorPage(status)) {
  redirectToCommonErrorPage();
}
```

#### 수정 후

```ts
if (errorCode === 'SECOND_AUTH_REQUIRED') {
  clearSecondAuthPassed();
  return Promise.reject(error);
}

if (shouldRedirectToCommonErrorPage(status)) {
  redirectToCommonErrorPage();
}
```

#### 핵심 변경 사항

- 2차 인증 필요 응답은 공통 에러 페이지로 보내지 않음
- 세션의 2차 인증 상태만 초기화하여 재인증 흐름으로 복귀

### 7.8 `backend/src/main/resources/db/migration/V37__add_second_auth_state_to_refresh_tokens.sql`

#### 수정 전

```sql
-- 파일 없음
```

#### 수정 후

```sql
ALTER TABLE refresh_tokens
    ADD COLUMN session_id VARCHAR(36) NULL AFTER user_id,
    ADD COLUMN second_auth_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER token_hash;
```

#### 핵심 변경 사항

- 기존 refresh token 테이블에 세션 기반 2차 인증 상태 저장용 컬럼 추가

## 8. 재점검 기준

조치 후에는 아래와 같은 결과가 나와야 한다.

- `/dashboard` 직접 접근 시
  - 2차 인증 전에는 마이페이지 하위 컴포넌트가 먼저 렌더링되지 않아야 함
  - 2차 인증 모달만 표시되어야 함
- Burp Suite로 `/api/auth/me` 직접 호출 시
  - 2차 인증 미완료 세션이면 `403 Forbidden`과 `SECOND_AUTH_REQUIRED`가 반환되어야 함
- Burp Suite로 `/api/dashboard/summary`, `/api/cards`, `/api/points/balance` 등 직접 호출 시
  - 2차 인증 미완료 세션이면 동일하게 차단되어야 함
- 2차 인증 성공 후
  - 새 access token이 발급되어야 함
  - 같은 세션에서 마이페이지 API 호출이 정상 동작해야 함
- refresh token 갱신 후
  - 같은 세션의 2차 인증 상태가 유지되어 재인증 없이 정상 사용 가능해야 함

## 9. 배포 시 유의사항

- 본 조치는 DB 마이그레이션 `V37__add_second_auth_state_to_refresh_tokens.sql` 적용이 선행되어야 한다.
- 배포 이전에 발급된 기존 access token / refresh token에는 `sessionId`, `secondAuthVerified` 클레임이 없으므로, 배포 후에는 사용자 재로그인을 유도하는 것이 안전하다.

## 10. 최종 판단

`/dashboard` 마이페이지 2차 인증 우회 취약점에 대해, 최초에 제시한 대응 방안은 코드 기준으로 모두 이행 완료되었다.

- 서버 사이드 2차 인증 완료 여부 검증: 이행 완료
- `/api/auth/me` 및 마이페이지 민감 API 차단: 이행 완료
- 2차 인증 전 페이지 선행 렌더링 차단: 이행 완료

따라서 본 건은 **프론트 UI 우회 여부와 관계없이 서버가 민감 API 접근을 직접 통제하는 구조로 개선되었고**,  
**마이페이지는 2차 인증 완료 이후에만 실제 콘텐츠가 마운트되는 상태**로 판단할 수 있다.
