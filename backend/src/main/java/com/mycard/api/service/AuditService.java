package com.mycard.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycard.api.config.RequestIdFilter;
import com.mycard.api.entity.AuditLog;
import com.mycard.api.repository.AuditLogRepository;
import com.mycard.api.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(AuditLog.ActionType actionType, String resourceType, Long resourceId, String description) {
        try {
            AuditLog auditLog = buildAuditLog(actionType, resourceType, resourceId, description, null);
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log", e);
        }
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logWithDiff(AuditLog.ActionType actionType, String resourceType, Long resourceId,
                            String description, Object oldValue, Object newValue) {
        try {
            String diffJson = createDiffJson(oldValue, newValue);
            AuditLog auditLog = buildAuditLog(actionType, resourceType, resourceId, description, diffJson);
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log", e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logSync(AuditLog.ActionType actionType, String resourceType, Long resourceId, String description) {
        try {
            AuditLog auditLog = buildAuditLog(actionType, resourceType, resourceId, description, null);
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log synchronously", e);
        }
    }

    private AuditLog buildAuditLog(AuditLog.ActionType actionType, String resourceType,
                                    Long resourceId, String description, String diffJson) {
        AuditLog.AuditLogBuilder builder = AuditLog.builder()
                .actionType(actionType)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .description(description)
                .diffJson(diffJson)
                .actorRole("SYSTEM")
                .requestId(MDC.get(RequestIdFilter.REQUEST_ID_MDC_KEY));

        // 현재 인증된 사용자 정보 추가
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal userPrincipal) {
            String actorRole = userPrincipal.getAuthorities().stream()
                    .findFirst()
                    .map(grantedAuthority -> grantedAuthority.getAuthority())
                    .orElse("USER");
            builder.userId(userPrincipal.getId())
                   .username(userPrincipal.getUsername())
                   .actorRole(actorRole);
        }

        // HTTP 요청 정보 추가
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            builder.ipAddress(getClientIp(request))
                   .userAgent(truncate(request.getHeader("User-Agent"), 500))
                   .requestUri(request.getRequestURI())
                   .requestMethod(request.getMethod());
        }

        return builder.build();
    }

    private String createDiffJson(Object oldValue, Object newValue) {
        try {
            return objectMapper.writeValueAsString(new DiffWrapper(oldValue, newValue));
        } catch (Exception e) {
            log.warn("Failed to create diff JSON", e);
            return null;
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }

    private record DiffWrapper(Object before, Object after) {}
}
