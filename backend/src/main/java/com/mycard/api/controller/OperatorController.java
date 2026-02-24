package com.mycard.api.controller;

import com.mycard.api.dto.AuditLogResponse;
import com.mycard.api.dto.UserAdminResponse;
import com.mycard.api.dto.inquiry.InquiryDetailResponse;
import com.mycard.api.dto.inquiry.InquiryListResponse;
import com.mycard.api.dto.inquiry.InquiryReplyRequest;
import com.mycard.api.entity.AuditLog;
import com.mycard.api.repository.AuditLogRepository;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.InquiryService;
import com.mycard.api.service.UserAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Operator", description = "운영자 전용 API")
@RestController
@RequestMapping("/operator")
@PreAuthorize("hasAnyRole('OPERATOR', 'ADMIN')")
@RequiredArgsConstructor
public class OperatorController {

    private final UserAdminService userAdminService;
    private final AuditLogRepository auditLogRepository;
    private final InquiryService inquiryService;

    @Operation(summary = "사용자 목록 조회")
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

    @Operation(summary = "사용자 상세 조회")
    @GetMapping("/users/{userId}")
    public ResponseEntity<UserAdminResponse> getUser(@PathVariable Long userId) {
        UserAdminResponse user = userAdminService.getUser(userId);
        return ResponseEntity.ok(user);
    }

    @Operation(summary = "문의 큐 조회")
    @GetMapping("/inquiries")
    public ResponseEntity<Page<InquiryListResponse>> getInquiries(
            @RequestParam(defaultValue = "unassigned") String queue,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<InquiryListResponse> response = "assigned".equalsIgnoreCase(queue)
                ? inquiryService.getMyAssignedInquiries(currentUser, pageable)
                : inquiryService.getUnassignedInquiries(pageable);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "문의 상세 조회")
    @GetMapping("/inquiries/{inquiryId}")
    public ResponseEntity<InquiryDetailResponse> getInquiry(
            @PathVariable Long inquiryId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(inquiryService.getInquiry(inquiryId, currentUser));
    }

    @Operation(summary = "문의 배정")
    @PostMapping("/inquiries/{inquiryId}/assign")
    public ResponseEntity<InquiryDetailResponse> assignInquiry(
            @PathVariable Long inquiryId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(inquiryService.assignInquiry(inquiryId, currentUser));
    }

    @Operation(summary = "문의 답변 등록")
    @PostMapping("/inquiries/{inquiryId}/replies")
    public ResponseEntity<InquiryDetailResponse> addReply(
            @PathVariable Long inquiryId,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @org.springframework.web.bind.annotation.RequestBody InquiryReplyRequest request) {
        return ResponseEntity.ok(inquiryService.addReply(inquiryId, currentUser, request));
    }

    @Operation(summary = "문의 종료")
    @PostMapping("/inquiries/{inquiryId}/resolve")
    public ResponseEntity<InquiryDetailResponse> resolveInquiry(
            @PathVariable Long inquiryId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(inquiryService.resolveInquiry(inquiryId, currentUser));
    }

    @Operation(summary = "감사로그 조회")
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
            logs = auditLogRepository.findAllOrderByCreatedAtDesc(pageable);
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