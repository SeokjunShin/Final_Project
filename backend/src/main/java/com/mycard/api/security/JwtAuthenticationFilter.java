package com.mycard.api.security;

import com.mycard.api.repository.RefreshTokenRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.time.LocalDateTime;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final RefreshTokenRepository refreshTokenRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                if (!tokenProvider.isAccessToken(jwt)) {
                    filterChain.doFilter(request, response);
                    return;
                }
 

                Long userId = tokenProvider.getUserIdFromToken(jwt);
                String sessionId = tokenProvider.getSessionIdFromToken(jwt);
                if (!StringUtils.hasText(sessionId)) {
                    filterChain.doFilter(request, response);
                    return;
                }

                List<com.mycard.api.entity.RefreshToken> activeSessionTokens =
                        refreshTokenRepository.findActiveTokensByUserIdAndSessionId(userId, sessionId, LocalDateTime.now());
                if (activeSessionTokens.isEmpty()) {
                    filterChain.doFilter(request, response);
                    return;
                }
                if (!SessionFingerprintUtils.matches(activeSessionTokens.get(0), request)) {
                    activeSessionTokens.forEach(com.mycard.api.entity.RefreshToken::revoke);
                    refreshTokenRepository.saveAll(activeSessionTokens);
                    log.warn("Blocked access token due to session fingerprint mismatch: userId={}, sessionId={}", userId, sessionId);
                    filterChain.doFilter(request, response);
                    return;
                }

                UserPrincipal userDetails = (UserPrincipal) userDetailsService.loadUserById(userId);

                if (!userDetails.isEnabled() || !userDetails.isAccountNonLocked()) {
                    filterChain.doFilter(request, response);
                    return;
                }

                UserPrincipal authenticatedPrincipal = userDetails.withSecondAuth(
                        sessionId,
                        tokenProvider.isSecondAuthVerified(jwt));

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                authenticatedPrincipal,
                                null,
                                authenticatedPrincipal.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            log.debug("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
