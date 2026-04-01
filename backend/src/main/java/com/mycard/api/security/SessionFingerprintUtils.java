package com.mycard.api.security;

import com.mycard.api.entity.RefreshToken;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;

public final class SessionFingerprintUtils {

    private SessionFingerprintUtils() {
    }

    public static String extractClientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xForwardedFor)) {
            return normalizeValue(xForwardedFor.split(",")[0]);
        }
        return normalizeValue(request.getRemoteAddr());
    }

    public static String extractUserAgent(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        return normalizeValue(request.getHeader("User-Agent"));
    }

    public static boolean matches(RefreshToken refreshToken, HttpServletRequest request) {
        return matches(refreshToken, extractClientIp(request), extractUserAgent(request));
    }

    public static boolean matches(RefreshToken refreshToken, String ipAddress, String userAgent) {
        if (refreshToken == null) {
            return false;
        }

        String storedUserAgent = normalizeValue(refreshToken.getUserAgent());
        String currentUserAgent = normalizeValue(userAgent);
        if (storedUserAgent != null && currentUserAgent != null && !storedUserAgent.equals(currentUserAgent)) {
            return false;
        }

        String storedIp = normalizeValue(refreshToken.getIpAddress());
        String currentIp = normalizeValue(ipAddress);
        if (storedIp != null && currentIp != null && !storedIp.equals(currentIp)) {
            return false;
        }

        return true;
    }

    private static String normalizeValue(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String normalized = value.trim();
        return normalized.equalsIgnoreCase("unknown") ? null : normalized;
    }
}
