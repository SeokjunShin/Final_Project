package com.mycard.api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SecondAuthEnforcementFilterTest {

    private final SecondAuthEnforcementFilter filter =
            new SecondAuthEnforcementFilter(new ObjectMapper().registerModule(new JavaTimeModule()));

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void blocksProtectedEndpointWhenSecondAuthIsMissing() throws Exception {
        UserPrincipal principal = new UserPrincipal(
                1L,
                "user@example.com",
                "password",
                "user@example.com",
                "홍길동",
                true,
                false,
                "session-1",
                false,
                List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/auth/me");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("SECOND_AUTH_REQUIRED");
    }

    @Test
    void allowsProtectedEndpointWhenSecondAuthIsVerified() throws Exception {
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
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/dashboard/summary");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(filterChain.getRequest()).isNotNull();
    }
}
