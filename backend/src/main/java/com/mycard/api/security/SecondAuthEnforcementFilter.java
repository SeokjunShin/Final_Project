package com.mycard.api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycard.api.dto.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SecondAuthEnforcementFilter extends OncePerRequestFilter {

    private static final List<String> SECOND_AUTH_REQUIRED_PREFIXES = List.of(
            "/auth/me",
            "/dashboard",
            "/me",
            "/statements",
            "/approvals",
            "/cards",
            "/card-applications",
            "/points",
            "/bank-accounts",
            "/inquiries",
            "/docs",
            "/documents",
            "/messages",
            "/loans");

    private static final List<String> SECOND_AUTH_EXEMPT_PREFIXES = List.of(
            "/auth/verify-second-password",
            "/auth/register-second-password",
            "/auth/refresh",
            "/auth/logout",
            "/auth/second-password/reset");

    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String requestPath = getRequestPath(request);

        if (HttpMethod.OPTIONS.matches(request.getMethod())
                || isExemptPath(requestPath)
                || !requiresSecondAuth(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal userPrincipal)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!userPrincipal.isUser() || userPrincipal.isStaff()) {
            filterChain.doFilter(request, response);
            return;
        }

        if (userPrincipal.isSecondAuthVerified()) {
            filterChain.doFilter(request, response);
            return;
        }

        log.debug("Second auth required for user {} on {}", userPrincipal.getId(), requestPath);
        writeForbiddenResponse(response);
    }

    private String getRequestPath(HttpServletRequest request) {
        String contextPath = request.getContextPath();
        String requestUri = request.getRequestURI();
        if (contextPath == null || contextPath.isBlank()) {
            return requestUri;
        }
        return requestUri.startsWith(contextPath)
                ? requestUri.substring(contextPath.length())
                : requestUri;
    }

    private boolean requiresSecondAuth(String requestUri) {
        return SECOND_AUTH_REQUIRED_PREFIXES.stream()
                .anyMatch(prefix -> requestUri.equals(prefix) || requestUri.startsWith(prefix + "/"));
    }

    private boolean isExemptPath(String requestUri) {
        return SECOND_AUTH_EXEMPT_PREFIXES.stream()
                .anyMatch(prefix -> requestUri.equals(prefix) || requestUri.startsWith(prefix + "/"));
    }

    private void writeForbiddenResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getOutputStream(), new ErrorResponse(
                "SECOND_AUTH_REQUIRED",
                "요청하신 페이지를 처리할 수 없습니다."));
    }
}
