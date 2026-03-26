# JWT 세션 보안 조치 이행 보고서

## 1. 조치 목적

기존 JWT 인증 구조는 다음과 같은 보완 필요 사항이 있었다.

- 로그아웃 후에도 만료 전 access token이 계속 사용될 수 있음
- 인증 필터가 bearer 토큰의 실제 타입을 검증하지 않아 refresh token 오용 가능성이 있음
- refresh token을 회전 발급하더라도 최초 로그인 시점 기준의 절대 세션 만료가 없어 세션이 과도하게 연장될 수 있음
- 폐기된 refresh token 재사용이나 비정상적인 세션 갱신 시도를 탐지·차단하는 로직이 부족함

## 2. 조치 이행 결과

| 대응 방안 | 이행 여부 | 조치 내용 |
| --- | --- | --- |
| 로그아웃 및 계정 상태 변경 시 access token 즉시 무효화 | 이행 완료 | access token을 DB 세션 상태와 연동하여 활성 세션이 아니면 인증하지 않도록 변경 |
| 인증 필터의 토큰 타입 검증 추가 | 이행 완료 | `Authorization: Bearer` 토큰은 `type=access`인 경우에만 인증 허용 |
| refresh token 절대 세션 최대 수명 적용 | 이행 완료 | 최초 로그인 시점 기준 `absolute_expires_at`을 저장하고 초과 시 재로그인 강제 |
| refresh token 오용 및 탈취 징후 감지 | 이행 완료 | 폐기된 refresh token 재사용, 세션 fingerprint 불일치 시 세션 폐기 및 보안 이벤트 기록 |
| refresh token으로 일반 API 인증 금지 | 이행 완료 | 인증 필터에서 refresh token은 무시하고 access token만 인증에 사용 |

## 3. 전체 수정 내용

### 3.1 서버 측 세션 상태 기반 access token 무효화

- access token 검증 시 서명만 확인하지 않고 `sessionId`를 추출한 뒤 `refresh_tokens` 테이블의 활성 세션 존재 여부를 추가 검증하도록 변경하였다.
- 이에 따라 로그아웃, 비밀번호 변경, 2차 비밀번호 변경, 관리자 계정 상태 변경 등으로 세션이 revoke되면 기존 access token도 즉시 사용할 수 없도록 조치하였다.

### 3.2 토큰 타입 검증 강화

- access token 발급 시 `type=access` 클레임을 추가하였다.
- refresh token 발급 시 `type=refresh`를 유지하였다.
- 인증 필터는 `type=access`가 아닌 토큰을 인증 컨텍스트에 올리지 않도록 변경하였다.
- `/auth/refresh`에서는 `type=refresh`가 아닌 토큰을 거부하도록 변경하였다.

### 3.3 refresh token 절대 세션 수명 도입

- `refresh_tokens` 테이블에 `session_started_at`, `absolute_expires_at` 컬럼을 추가하였다.
- 최초 로그인 시점에 절대 세션 만료 시각을 계산해 저장하고, refresh 회전 시에도 동일한 절대 만료 시각을 유지하도록 변경하였다.
- 절대 세션 만료를 초과한 경우 refresh를 거부하고 세션을 폐기하도록 조치하였다.

### 3.4 탈취 징후 탐지 및 세션 차단

- 이미 revoke된 refresh token이 다시 사용되면 토큰 재사용 공격으로 판단하여 해당 세션을 강제 종료하도록 변경하였다.
- refresh 요청 시 저장된 세션의 User-Agent와 현재 요청의 User-Agent가 불일치하는 경우 비정상 세션 갱신으로 간주하여 세션을 폐기하도록 조치하였다.
- 위 이벤트는 감사 로그에 `SECURITY_ALERT`로 기록되도록 변경하였다.

## 4. 수정 파일

### 백엔드

- `backend/src/main/java/com/mycard/api/security/JwtTokenProvider.java`
- `backend/src/main/java/com/mycard/api/security/JwtAuthenticationFilter.java`
- `backend/src/main/java/com/mycard/api/service/AuthService.java`
- `backend/src/main/java/com/mycard/api/service/UserSecurityService.java`
- `backend/src/main/java/com/mycard/api/service/UserAdminService.java`
- `backend/src/main/java/com/mycard/api/controller/AuthController.java`
- `backend/src/main/java/com/mycard/api/controller/AdminController.java`
- `backend/src/main/java/com/mycard/api/entity/RefreshToken.java`
- `backend/src/main/java/com/mycard/api/repository/RefreshTokenRepository.java`
- `backend/src/main/java/com/mycard/api/exception/UnauthorizedException.java`
- `backend/src/main/java/com/mycard/api/exception/GlobalExceptionHandler.java`
- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/db/migration/V38__strengthen_refresh_token_sessions.sql`

### 테스트

- `backend/src/test/java/com/mycard/api/security/JwtTokenProviderTest.java`
- `backend/src/test/java/com/mycard/api/security/JwtAuthenticationFilterTest.java`
- `backend/src/test/java/com/mycard/api/service/AuthServiceTest.java`

## 5. 수정 코드 비교

### 5.1 JwtTokenProvider.java

#### 수정 전

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

```java
return Jwts.builder()
        .subject(String.valueOf(userId))
        .id(UUID.randomUUID().toString())
        .claim("type", "refresh")
        .claim("sessionId", sessionId)
        .issuedAt(now)
        .expiration(expiryDate)
        .signWith(secretKey)
        .compact();
```

#### 수정 후

```java
public static final String ACCESS_TOKEN_TYPE = "access";
public static final String REFRESH_TOKEN_TYPE = "refresh";
```

```java
return Jwts.builder()
        .subject(String.valueOf(userPrincipal.getId()))
        .claim("type", ACCESS_TOKEN_TYPE)
        .claim("username", userPrincipal.getUsername())
        .claim("roles", roles)
        .claim("sessionId", sessionId)
        .claim("secondAuthVerified", secondAuthVerified)
        .issuedAt(now)
        .expiration(expiryDate)
        .signWith(secretKey)
        .compact();
```

```java
return Jwts.builder()
        .subject(String.valueOf(userId))
        .id(UUID.randomUUID().toString())
        .claim("type", REFRESH_TOKEN_TYPE)
        .claim("sessionId", sessionId)
        .issuedAt(now)
        .expiration(expiryDate)
        .signWith(secretKey)
        .compact();
```

```java
public boolean isAccessToken(String token) {
    return ACCESS_TOKEN_TYPE.equals(getTokenType(token));
}

public boolean isRefreshToken(String token) {
    return REFRESH_TOKEN_TYPE.equals(getTokenType(token));
}
```

설명:
access token에도 명시적으로 `type=access`를 부여하고, refresh token은 `type=refresh`로 분리하여 이후 인증 필터와 refresh API에서 토큰 용도를 강제하도록 변경하였다.

### 5.2 JwtAuthenticationFilter.java

#### 수정 전

```java
if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
    Long userId = tokenProvider.getUserIdFromToken(jwt);
    UserPrincipal userDetails = (UserPrincipal) userDetailsService.loadUserById(userId);

    UserPrincipal authenticatedPrincipal = userDetails.withSecondAuth(
            tokenProvider.getSessionIdFromToken(jwt),
            tokenProvider.isSecondAuthVerified(jwt));

    SecurityContextHolder.getContext().setAuthentication(authentication);
}
```

#### 수정 후

```java
if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
    if (!tokenProvider.isAccessToken(jwt)) {
        filterChain.doFilter(request, response);
        return;
    }

    Long userId = tokenProvider.getUserIdFromToken(jwt);
    String sessionId = tokenProvider.getSessionIdFromToken(jwt);

    if (!StringUtils.hasText(sessionId)
            || !refreshTokenRepository.existsActiveSession(userId, sessionId, LocalDateTime.now())) {
        filterChain.doFilter(request, response);
        return;
    }

    UserPrincipal userDetails = (UserPrincipal) userDetailsService.loadUserById(userId);
    UserPrincipal authenticatedPrincipal = userDetails.withSecondAuth(
            sessionId,
            tokenProvider.isSecondAuthVerified(jwt));

    SecurityContextHolder.getContext().setAuthentication(authentication);
}
```

설명:
기존에는 JWT 서명만 유효하면 인증이 성립했다. 수정 후에는 bearer 토큰이 반드시 access token이어야 하며, 해당 `sessionId`가 DB상 활성 세션인 경우에만 인증이 성립하도록 강화하였다.

### 5.3 AuthService.java

#### 수정 전

```java
public TokenResponse refreshToken(String refreshToken) {
    if (!tokenProvider.validateToken(refreshToken)) {
        throw new BadRequestException("유효하지 않은 refresh token입니다.");
    }

    String tokenHash = hashToken(refreshToken);
    RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new BadRequestException("Refresh token을 찾을 수 없습니다."));

    if (!storedToken.isValid()) {
        throw new BadRequestException("Refresh token이 만료되었거나 취소되었습니다.");
    }

    storedToken.revoke();
    refreshTokenRepository.save(storedToken);

    String newRefreshToken = tokenProvider.generateRefreshToken(userId, storedToken.getSessionId());
    saveRefreshToken(userId, newRefreshToken, ipAddress, userAgent, storedToken.getSessionId(), storedToken.isSecondAuthVerified());

    return new TokenResponse(newAccessToken, newRefreshToken);
}
```

```java
public void logout(String refreshToken) {
    if (refreshToken != null && !refreshToken.isBlank()) {
        String tokenHash = hashToken(refreshToken);
        refreshTokenRepository.findByTokenHash(tokenHash)
                .ifPresent(token -> {
                    token.revoke();
                    refreshTokenRepository.save(token);
                });
    }
}
```

#### 수정 후

```java
@Value("${app.jwt.absolute-session-validity-ms:2592000000}")
private long absoluteSessionValidityMs;
```

```java
public TokenResponse refreshToken(String refreshToken) {
    if (!tokenProvider.validateToken(refreshToken)) {
        throw new UnauthorizedException("INVALID_REFRESH_TOKEN", "유효하지 않은 refresh token입니다.");
    }
    if (!tokenProvider.isRefreshToken(refreshToken)) {
        throw new UnauthorizedException("INVALID_TOKEN_TYPE", "refresh token 형식이 아닙니다.");
    }

    RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new UnauthorizedException("REFRESH_TOKEN_NOT_FOUND", "Refresh token을 찾을 수 없습니다."));

    if (storedToken.isRevoked()) {
        handleRefreshTokenCompromise(storedToken, "Revoked refresh token reuse detected");
        throw new UnauthorizedException("REFRESH_TOKEN_REUSED", "재사용된 refresh token이 감지되었습니다.");
    }

    if (storedToken.isExpired() || storedToken.isAbsoluteExpired()) {
        revokeSessionTokens(storedToken.getUser().getId(), storedToken.getSessionId());
        throw new UnauthorizedException("SESSION_EXPIRED", "세션이 만료되었습니다.");
    }

    if (isSuspiciousSessionFingerprint(storedToken, ipAddress, userAgent)) {
        handleRefreshTokenCompromise(storedToken, "Refresh token fingerprint mismatch detected");
        throw new UnauthorizedException("SUSPICIOUS_REFRESH_ACTIVITY", "비정상적인 세션 갱신이 감지되었습니다.");
    }

    storedToken.revoke();
    refreshTokenRepository.save(storedToken);

    saveRefreshToken(
            userId,
            newRefreshToken,
            ipAddress,
            userAgent,
            storedToken.getSessionId(),
            storedToken.isSecondAuthVerified(),
            storedToken.getSessionStartedAt(),
            storedToken.getAbsoluteExpiresAt());

    return new TokenResponse(newAccessToken, newRefreshToken);
}
```

```java
public void logout(String accessToken, String refreshToken) {
    if (refreshToken != null && tokenProvider.validateToken(refreshToken) && tokenProvider.isRefreshToken(refreshToken)) {
        revokeSessionTokens(token.getUser().getId(), token.getSessionId());
    }

    if (accessToken != null && tokenProvider.validateToken(accessToken) && tokenProvider.isAccessToken(accessToken)) {
        revokeSessionTokens(userId, sessionId);
    }
}
```

```java
private SessionTokens issueSessionTokens(...) {
    LocalDateTime sessionStartedAt = LocalDateTime.now();
    LocalDateTime absoluteExpiresAt = sessionStartedAt.plusNanos(absoluteSessionValidityMs * 1_000_000L);
    String sessionId = UUID.randomUUID().toString();
    ...
}
```

설명:
refresh token의 단순 회전 구조를 세션 기반 구조로 강화하였다. 재사용된 refresh token, 절대 만료 초과 세션, 비정상 fingerprint를 모두 차단하며, 로그아웃도 refresh token만 폐기하는 방식이 아니라 세션 단위 revoke 방식으로 변경하였다.

### 5.4 RefreshToken.java / RefreshTokenRepository.java

#### 수정 전

```java
@Column(name = "expires_at", nullable = false)
private LocalDateTime expiresAt;

public boolean isValid() {
    return !isExpired() && !isRevoked();
}
```

```java
@Query("SELECT rt FROM RefreshToken rt WHERE rt.user.id = :userId AND rt.revokedAt IS NULL AND rt.expiresAt > :now")
List<RefreshToken> findActiveTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
```

#### 수정 후

```java
@Column(name = "session_started_at", nullable = false)
private LocalDateTime sessionStartedAt;

@Column(name = "absolute_expires_at", nullable = false)
private LocalDateTime absoluteExpiresAt;

public boolean isValid() {
    return !isExpired() && !isAbsoluteExpired() && !isRevoked();
}

public boolean isAbsoluteExpired() {
    return LocalDateTime.now().isAfter(absoluteExpiresAt);
}
```

```java
@Query("""
        SELECT CASE WHEN COUNT(rt) > 0 THEN true ELSE false END
        FROM RefreshToken rt
        WHERE rt.user.id = :userId
          AND rt.sessionId = :sessionId
          AND rt.revokedAt IS NULL
          AND rt.expiresAt > :now
          AND rt.absoluteExpiresAt > :now
        """)
boolean existsActiveSession(Long userId, String sessionId, LocalDateTime now);

@Modifying
@Query("""
        UPDATE RefreshToken rt
        SET rt.revokedAt = :now
        WHERE rt.user.id = :userId
          AND rt.sessionId = :sessionId
          AND rt.revokedAt IS NULL
        """)
int revokeSessionTokens(Long userId, String sessionId, LocalDateTime now);
```

설명:
refresh token을 단순 토큰 목록이 아니라 “세션 저장소”로 사용하도록 구조를 확장하였다. 이로 인해 access token도 DB 세션 존재 여부를 기준으로 즉시 무효화할 수 있게 되었다.

### 5.5 UserSecurityService.java / UserAdminService.java / AuthController.java

#### 수정 전

```java
user.setPassword(passwordEncoder.encode(request.getNewPassword()));
userRepository.save(user);
```

```java
user.setSecondaryPassword(passwordEncoder.encode(request.getNewSecondaryPassword()));
userRepository.save(user);
```

```java
public ResponseEntity<Void> logout(@RequestBody(required = false) RefreshTokenRequest request) {
    if (request != null) {
        authService.logout(request.getRefreshToken());
    }
    return ResponseEntity.ok().build();
}
```

#### 수정 후

```java
user.setPassword(passwordEncoder.encode(request.getNewPassword()));
userRepository.save(user);
refreshTokenRepository.revokeAllUserTokens(user.getId(), LocalDateTime.now());
```

```java
user.setSecondaryPassword(passwordEncoder.encode(request.getNewSecondaryPassword()));
userRepository.save(user);
refreshTokenRepository.revokeAllUserTokens(user.getId(), LocalDateTime.now());
```

```java
refreshTokenRepository.revokeAllUserTokens(user.getId(), LocalDateTime.now());
return toResponse(user);
```

```java
public ResponseEntity<Void> logout(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestBody(required = false) RefreshTokenRequest request) {
    String accessToken = extractBearerToken(authorizationHeader);
    String refreshToken = request != null ? request.getRefreshToken() : null;
    authService.logout(accessToken, refreshToken);
    return ResponseEntity.ok().build();
}
```

설명:
비밀번호 변경, 2차 비밀번호 변경, 관리자 상태 변경, 로그아웃 등 보안 민감 작업 직후 모든 활성 세션 또는 해당 세션을 즉시 revoke하도록 변경하였다.

### 5.6 마이그레이션 / 설정

#### 수정 전

```yaml
app:
  jwt:
    access-token-validity-ms: 900000
    refresh-token-validity-ms: 604800000

spring:
  flyway:
    enabled: false
```

#### 수정 후

```yaml
app:
  jwt:
    access-token-validity-ms: ${JWT_ACCESS_TOKEN_VALIDITY_MS:900000}
    refresh-token-validity-ms: ${JWT_REFRESH_TOKEN_VALIDITY_MS:604800000}
    absolute-session-validity-ms: ${JWT_ABSOLUTE_SESSION_VALIDITY_MS:2592000000}

spring:
  flyway:
    enabled: ${SPRING_FLYWAY_ENABLED:true}
    baseline-on-migrate: ${SPRING_FLYWAY_BASELINE_ON_MIGRATE:true}
    validate-on-migrate: ${SPRING_FLYWAY_VALIDATE_ON_MIGRATE:false}
```

```sql
ALTER TABLE refresh_tokens
    ADD COLUMN session_started_at DATETIME(6) NULL AFTER expires_at,
    ADD COLUMN absolute_expires_at DATETIME(6) NULL AFTER session_started_at;
```

설명:
절대 세션 수명 값을 운영 환경에서 조정할 수 있도록 환경변수화하였고, Flyway를 통해 JWT 세션 관련 컬럼이 자동 반영되도록 설정을 보완하였다.

## 6. 보완 설명

이번 조치로 일반 API 인증은 access token으로만 수행되며, refresh token은 `/auth/refresh`에서만 사용된다.

또한 JWT 탈취에 대해 서버가 모든 경우를 자동 판별하여 “안전하게 재발급”하는 것은 현실적으로 한계가 있다. 따라서 본 조치에서는 다음과 같은 방식으로 대응하였다.

- refresh token 재사용 감지 시 세션 즉시 폐기
- 비정상 refresh fingerprint 감지 시 세션 즉시 폐기
- 사용자는 강제로 재로그인하도록 유도

즉, 탈취 의심 상황에서는 자동 연장이 아니라 세션 차단과 재인증 강제가 기본 정책이다.

## 7. 재점검 기대 결과

- 로그아웃 직후 기존 access token으로 `/api/auth/me` 호출 시 401 응답
- 관리자에 의한 계정 잠금/비활성화 후 기존 access token 사용 시 401 응답
- `Authorization` 헤더에 refresh token 삽입 시 인증 실패
- refresh token 회전을 반복하더라도 `absolute_expires_at` 초과 후에는 refresh 실패 및 재로그인 필요
- revoke된 refresh token 재사용 시 세션 폐기 및 보안 이벤트 기록
