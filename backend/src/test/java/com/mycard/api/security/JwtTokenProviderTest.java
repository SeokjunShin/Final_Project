package com.mycard.api.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private static final String SECRET =
            "mycard-test-secret-key-mycard-test-secret-key-1234567890";

    @Test
    void accessTokenIncludesSecondAuthClaims() {
        JwtTokenProvider tokenProvider = new JwtTokenProvider(SECRET, 60_000L, 120_000L);
        UserPrincipal userPrincipal = new UserPrincipal(
                1L,
                "user@example.com",
                "encoded-password",
                "user@example.com",
                "홍길동",
                true,
                false,
                "session-123",
                true,
                List.of(new SimpleGrantedAuthority("ROLE_USER")));

        String accessToken = tokenProvider.generateAccessToken(userPrincipal, "session-123", true);
        String refreshToken = tokenProvider.generateRefreshToken(1L, "session-123");

        assertThat(tokenProvider.validateToken(accessToken)).isTrue();
        assertThat(tokenProvider.getUserIdFromToken(accessToken)).isEqualTo(1L);
        assertThat(tokenProvider.getTokenType(accessToken)).isEqualTo(JwtTokenProvider.ACCESS_TOKEN_TYPE);
        assertThat(tokenProvider.getSessionIdFromToken(accessToken)).isEqualTo("session-123");
        assertThat(tokenProvider.isSecondAuthVerified(accessToken)).isTrue();
        assertThat(tokenProvider.getTokenType(refreshToken)).isEqualTo(JwtTokenProvider.REFRESH_TOKEN_TYPE);
        assertThat(tokenProvider.getSessionIdFromToken(refreshToken)).isEqualTo("session-123");
    }
}
