package com.mycard.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtTokenProvider {

    public static final String ACCESS_TOKEN_TYPE = "access";
    public static final String REFRESH_TOKEN_TYPE = "refresh";
    public static final String PASSWORD_RESET_TOKEN_TYPE = "password_reset";

    private final SecretKey secretKey;
    private final long accessTokenValidityMs;
    private final long refreshTokenValidityMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-validity-ms}") long accessTokenValidityMs,
            @Value("${app.jwt.refresh-token-validity-ms}") long refreshTokenValidityMs) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenValidityMs = accessTokenValidityMs;
        this.refreshTokenValidityMs = refreshTokenValidityMs;
    }

    public String generateAccessToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return generateAccessToken(
                userPrincipal,
                userPrincipal.getSessionId(),
                userPrincipal.isSecondAuthVerified());
    }

    public String generateAccessToken(UserPrincipal userPrincipal) {
        return generateAccessToken(
                userPrincipal,
                userPrincipal.getSessionId(),
                userPrincipal.isSecondAuthVerified());
    }

    public String generateAccessToken(UserPrincipal userPrincipal, String sessionId, boolean secondAuthVerified) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenValidityMs);

        String roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

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
    }

    public String generateRefreshToken(Long userId, String sessionId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenValidityMs);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .id(UUID.randomUUID().toString())
                .claim("type", REFRESH_TOKEN_TYPE)
                .claim("sessionId", sessionId)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    public String generatePasswordResetToken(Long userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + (10 * 60 * 1000L));

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .id(UUID.randomUUID().toString())
                .claim("type", PASSWORD_RESET_TOKEN_TYPE)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = parseClaims(token);
        return Long.parseLong(claims.getSubject());
    }

    public String getUsernameFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.get("username", String.class);
    }

    public String getSessionIdFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.get("sessionId", String.class);
    }

    public String getTokenType(String token) {
        Claims claims = parseClaims(token);
        return claims.get("type", String.class);
    }

    public boolean isSecondAuthVerified(String token) {
        Claims claims = parseClaims(token);
        Boolean verified = claims.get("secondAuthVerified", Boolean.class);
        return Boolean.TRUE.equals(verified);
    }

    public boolean isAccessToken(String token) {
        return ACCESS_TOKEN_TYPE.equals(getTokenType(token));
    }

    public boolean isRefreshToken(String token) {
        return REFRESH_TOKEN_TYPE.equals(getTokenType(token));
    }

    public boolean isPasswordResetToken(String token) {
        return PASSWORD_RESET_TOKEN_TYPE.equals(getTokenType(token));
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (MalformedJwtException ex) {
            log.debug("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            log.debug("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            log.debug("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            log.debug("JWT claims string is empty");
        } catch (JwtException ex) {
            log.debug("JWT validation error");
        }
        return false;
    }

    public Date getExpirationFromRefreshToken(String token) {
        Claims claims = parseClaims(token);
        return claims.getExpiration();
    }

    public long getRefreshTokenValidityMs() {
        return refreshTokenValidityMs;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
