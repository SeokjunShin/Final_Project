package com.mycard.api.controller;

import com.mycard.api.dto.*;
import com.mycard.api.entity.AuditLog;
import com.mycard.api.repository.AuditLogRepository;
import com.mycard.api.service.UserAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 운영자(OPERATOR) 전용 API 컨트롤러
 * - 사용자 조회 (수정 불가)
 * - 문의 답변
 * - 감사 로그 조회
 */
@Tag(name = "Operator", description = "운영자 전용 API")
@RestController
@RequestMapping("/operator")
@PreAuthorize("hasAnyRole('OPERATOR', 'ADMIN')")
@RequiredArgsConstructor
public class OperatorController {

    private final UserAdminService userAdminService;
    private final AuditLogRepository auditLogRepository;

    /**
     * 사용자 목록 조회
     */
    @Operation(summary = "사용자 목록 조회", description = "전체 사용자 목록을 조회합니다.")
    @GetMapping("/users")
    public ResponseEntity<Page<UserAdminResponse>> getUsers(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<UserAdminResponse> users;
        if (keyword != null && !keyword.isEmpty()) {
            users = userAdminService.searchUsers(keyword, pageable);
        } else {
            users = userAdminService.getUsers(pageable);
        }
        return ResponseEntity.ok(users);
    }

    /**
     * 사용자 상세 조회
     */
    @Operation(summary = "사용자 상세 조회", description = "특정 사용자의 상세 정보를 조회합니다.")
    @GetMapping("/users/{userId}")
    public ResponseEntity<UserAdminResponse> getUser(@PathVariable Long userId) {
        UserAdminResponse user = userAdminService.getUser(userId);
        return ResponseEntity.ok(user);
    }

    /**
     * 감사 로그 조회
     */
    @Operation(summary = "감사 로그 조회", description = "시스템 감사 로그를 조회합니다.")
    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String action,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<AuditLog> logs;
        if (userId != null) {
            logs = auditLogRepository.findByUserId(userId, pageable);
        } else if (action != null && !action.isEmpty()) {
            logs = auditLogRepository.findByAction(action, pageable);
        } else {
            logs = auditLogRepository.findAll(pageable);
        }

        Page<AuditLogResponse> response = logs.map(this::toAuditLogResponse);
        return ResponseEntity.ok(response);
    }

    private AuditLogResponse toAuditLogResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .userId(log.getUserId())
                .username(log.getUsername())
                .action(log.getAction())
                .resourceType(log.getResourceType())
                .resourceId(log.getResourceId())
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
