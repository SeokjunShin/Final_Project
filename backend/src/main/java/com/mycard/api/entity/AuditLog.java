package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Immutable
@Getter
@Setter
@NoArgsConstructor
public class AuditLog {

    public enum ActionType {
        CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ACCESS, EXPORT,
        // 추가 액션 타입
        NOTICE_CREATE, INQUIRY_ANSWER, POINT_POLICY_UPD,
        USER_UPDATE, CARD_APPLICATION, DOCUMENT_REVIEW, MESSAGE_SEND
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id")
    private Long userId;

    @Transient
    private String username;

    @Column(name = "actor_role", length = 20)
    private String actorRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 80)
    private ActionType actionType;

    @Column(name = "target_type", nullable = false, length = 40)
    private String resourceType;

    @Column(name = "target_id")
    private Long resourceId;

    @Transient
    private String description;

    @Column(name = "diff_json", columnDefinition = "JSON")
    private String diffJson;

    @Column(name = "ip", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "request_id", length = 64)
    private String requestId;

    @Transient
    private String requestUri;

    @Transient
    private String requestMethod;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public AuditLog(Long userId, String username, ActionType actionType,
                    String resourceType, Long resourceId, String description) {
        this.userId = userId;
        this.username = username;
        this.actionType = actionType;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.description = description;
    }

    public String getAction() {
        return actionType != null ? actionType.name() : null;
    }

    public String getDetails() {
        return description != null ? description : diffJson;
    }

    public static AuditLogBuilder builder() {
        return new AuditLogBuilder();
    }

    public static class AuditLogBuilder {
        private final AuditLog auditLog = new AuditLog();

        public AuditLogBuilder userId(Long userId) {
            auditLog.setUserId(userId);
            return this;
        }

        public AuditLogBuilder username(String username) {
            auditLog.setUsername(username);
            return this;
        }

        public AuditLogBuilder actionType(ActionType actionType) {
            auditLog.setActionType(actionType);
            return this;
        }

        public AuditLogBuilder actorRole(String actorRole) {
            auditLog.setActorRole(actorRole);
            return this;
        }

        public AuditLogBuilder resourceType(String resourceType) {
            auditLog.setResourceType(resourceType);
            return this;
        }

        public AuditLogBuilder resourceId(Long resourceId) {
            auditLog.setResourceId(resourceId);
            return this;
        }

        public AuditLogBuilder description(String description) {
            auditLog.setDescription(description);
            return this;
        }

        public AuditLogBuilder diffJson(String diffJson) {
            auditLog.setDiffJson(diffJson);
            return this;
        }

        public AuditLogBuilder ipAddress(String ipAddress) {
            auditLog.setIpAddress(ipAddress);
            return this;
        }

        public AuditLogBuilder userAgent(String userAgent) {
            auditLog.setUserAgent(userAgent);
            return this;
        }

        public AuditLogBuilder requestId(String requestId) {
            auditLog.setRequestId(requestId);
            return this;
        }

        public AuditLogBuilder requestUri(String requestUri) {
            auditLog.setRequestUri(requestUri);
            return this;
        }

        public AuditLogBuilder requestMethod(String requestMethod) {
            auditLog.setRequestMethod(requestMethod);
            return this;
        }

        public AuditLog build() {
            return auditLog;
        }
    }
}
