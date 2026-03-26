package com.mycard.api.service;

import com.mycard.api.entity.AuditLog;
import com.mycard.api.entity.RefreshToken;
import com.mycard.api.entity.User;
import com.mycard.api.exception.UnauthorizedException;
import com.mycard.api.repository.LoginAttemptRepository;
import com.mycard.api.repository.RefreshTokenRepository;
import com.mycard.api.repository.RoleRepository;
import com.mycard.api.repository.UserRepository;
import com.mycard.api.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private LoginAttemptRepository loginAttemptRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditService auditService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    @Test
    void refreshRejectsRevokedRefreshTokenReuse() {
        User user = new User("user@example.com", "password", "홍길동");
        user.setId(1L);

        RefreshToken storedToken = new RefreshToken(
                user,
                "session-1",
                "hash",
                false,
                LocalDateTime.now().plusDays(1),
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(29),
                "JUnit",
                "127.0.0.1");
        storedToken.setRevokedAt(LocalDateTime.now().minusMinutes(1));

        when(tokenProvider.validateToken("refresh-token")).thenReturn(true);
        when(tokenProvider.isRefreshToken("refresh-token")).thenReturn(true);
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(storedToken));

        assertThatThrownBy(() -> authService.refreshToken("refresh-token"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("재사용된 refresh token");

        verify(refreshTokenRepository).revokeSessionTokens(eq(1L), eq("session-1"), any(LocalDateTime.class));
        verify(auditService).log(eq(AuditLog.ActionType.SECURITY_ALERT), eq("AUTH_SESSION"), eq(1L), contains("reuse"));
    }

    @Test
    void refreshRejectsAbsoluteExpiredSession() {
        User user = new User("user@example.com", "password", "홍길동");
        user.setId(1L);

        RefreshToken storedToken = new RefreshToken(
                user,
                "session-1",
                "hash",
                true,
                LocalDateTime.now().plusDays(1),
                LocalDateTime.now().minusDays(31),
                LocalDateTime.now().minusMinutes(1),
                "JUnit",
                "127.0.0.1");

        when(tokenProvider.validateToken("refresh-token")).thenReturn(true);
        when(tokenProvider.isRefreshToken("refresh-token")).thenReturn(true);
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(storedToken));

        assertThatThrownBy(() -> authService.refreshToken("refresh-token"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("세션이 만료");

        verify(refreshTokenRepository).revokeSessionTokens(eq(1L), eq("session-1"), any(LocalDateTime.class));
    }
}
