package com.mycard.api.security;

import com.mycard.api.repository.RefreshTokenRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void ignoresRefreshTokenInAuthorizationHeader() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer refresh-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(tokenProvider.validateToken("refresh-token")).thenReturn(true);
        when(tokenProvider.isAccessToken("refresh-token")).thenReturn(false);

        jwtAuthenticationFilter.doFilter(request, response, new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(userDetailsService, never()).loadUserById(any());
    }

    @Test
    void ignoresAccessTokenWhenSessionIsRevoked() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer access-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(tokenProvider.validateToken("access-token")).thenReturn(true);
        when(tokenProvider.isAccessToken("access-token")).thenReturn(true);
        when(tokenProvider.getUserIdFromToken("access-token")).thenReturn(1L);
        when(tokenProvider.getSessionIdFromToken("access-token")).thenReturn("session-1");
        when(refreshTokenRepository.existsActiveSession(eq(1L), eq("session-1"), any(LocalDateTime.class)))
                .thenReturn(false);

        jwtAuthenticationFilter.doFilter(request, response, new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(userDetailsService, never()).loadUserById(any());
    }

    @Test
    void authenticatesActiveAccessToken() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer access-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        UserPrincipal principal = new UserPrincipal(
                1L,
                "user@example.com",
                "password",
                "user@example.com",
                "홍길동",
                true,
                false,
                "session-1",
                true,
                List.of(new SimpleGrantedAuthority("ROLE_USER")));

        when(tokenProvider.validateToken("access-token")).thenReturn(true);
        when(tokenProvider.isAccessToken("access-token")).thenReturn(true);
        when(tokenProvider.getUserIdFromToken("access-token")).thenReturn(1L);
        when(tokenProvider.getSessionIdFromToken("access-token")).thenReturn("session-1");
        when(tokenProvider.isSecondAuthVerified("access-token")).thenReturn(true);
        when(refreshTokenRepository.existsActiveSession(eq(1L), eq("session-1"), any(LocalDateTime.class)))
                .thenReturn(true);
        when(userDetailsService.loadUserById(1L)).thenReturn(principal);

        jwtAuthenticationFilter.doFilter(request, response, new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal()).isInstanceOf(UserPrincipal.class);
    }
}
