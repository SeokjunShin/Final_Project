package com.mycard.api.controller;

import com.mycard.api.dto.AuditLogResponse;
import com.mycard.api.dto.UserAdminResponse;
import com.mycard.api.dto.inquiry.InquiryDetailResponse;
import com.mycard.api.dto.inquiry.InquiryListResponse;
import com.mycard.api.dto.inquiry.InquiryReplyRequest;
import com.mycard.api.entity.AuditLog;
import com.mycard.api.entity.Inquiry;
import com.mycard.api.repository.AuditLogRepository;
import com.mycard.api.repository.InquiryRepository;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.InquiryService;
import com.mycard.api.service.UserAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "Operator", description = "��� ���� API")
@RestController
@RequestMapping("/operator")
@PreAuthorize("hasAnyRole('OPERATOR', 'ADMIN')")
@RequiredArgsConstructor
public class OperatorController {

    private final UserAdminService userAdminService;
    private final AuditLogRepository auditLogRepository;
    private final InquiryService inquiryService;
    private final InquiryRepository inquiryRepository;

    // ===================== 대시보드 =====================

    @Operation(summary = "상담원 대시보드 통계")
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Map<String, Object> dashboard = new HashMap<>();

        // 미배정 문의 수
        long unassignedCount = inquiryRepository.countUnassigned();
        dashboard.put("unassignedInquiries", unassignedCount);

        // 내 배정 문의 수 (진행 중)
        long myInquiries = inquiryRepository.countByAssignedOperatorIdAndNotResolved(currentUser.getId());
        dashboard.put("myInquiries", myInquiries);

        // 전체 대기 중 문의 수
        long openCount = inquiryRepository.countByStatusOpen();
        dashboard.put("openInquiries", openCount);

        // 진행 중 문의 수
        long inProgressCount = inquiryRepository.countByStatusInProgress();
        dashboard.put("inProgressInquiries", inProgressCount);

        // 최근 미배정 문의 목록
        List<Map<String, Object>> recentUnassigned = new ArrayList<>();
        try {
            Page<Inquiry> unassigned = inquiryRepository.findUnassignedInquiries(PageRequest.of(0, 5));
            for (Inquiry inquiry : unassigned.getContent()) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", inquiry.getId());
                item.put("title", inquiry.getTitle());
                item.put("status", inquiry.getStatus().name());
                item.put("category", inquiry.getCategory() != null ? inquiry.getCategory().name() : null);
                item.put("createdAt", inquiry.getCreatedAt() != null ? inquiry.getCreatedAt().toString() : null);
                if (inquiry.getUser() != null) {
                    item.put("userName", inquiry.getUser().getName());
                }
                recentUnassigned.add(item);
            }
        } catch (Exception e) {
            // ignore
        }
        dashboard.put("recentUnassigned", recentUnassigned);

        // 내 최근 배정 문의 목록
        List<Map<String, Object>> myRecentInquiries = new ArrayList<>();
        try {
            Page<Inquiry> myAssigned = inquiryRepository.findByAssignedOperatorId(currentUser.getId(), PageRequest.of(0, 5));
            for (Inquiry inquiry : myAssigned.getContent()) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", inquiry.getId());
                item.put("title", inquiry.getTitle());
                item.put("status", inquiry.getStatus().name());
                item.put("category", inquiry.getCategory() != null ? inquiry.getCategory().name() : null);
                item.put("createdAt", inquiry.getCreatedAt() != null ? inquiry.getCreatedAt().toString() : null);
                if (inquiry.getUser() != null) {
                    item.put("userName", inquiry.getUser().getName());
                }
                myRecentInquiries.add(item);
            }
        } catch (Exception e) {
            // ignore
        }
        dashboard.put("myRecentInquiries", myRecentInquiries);

        return ResponseEntity.ok(dashboard);
    }

    @Operation(summary = "����� ��� ��ȸ")
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

    @Operation(summary = "����� �� ��ȸ")
    @GetMapping("/users/{userId}")
    public ResponseEntity<UserAdminResponse> getUser(@PathVariable Long userId) {
        UserAdminResponse user = userAdminService.getUser(userId);
        return ResponseEntity.ok(user);
    }

    @Operation(summary = "���� ť ��ȸ")
    @GetMapping("/inquiries")
    public ResponseEntity<Page<InquiryListResponse>> getInquiries(
            @RequestParam(defaultValue = "unassigned") String queue,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<InquiryListResponse> response;
        if ("assigned".equalsIgnoreCase(queue)) {
            response = inquiryService.getMyAssignedInquiries(currentUser, pageable);
        } else if ("all".equalsIgnoreCase(queue)) {
            response = inquiryService.getAllInquiries(pageable);
        } else {
            response = inquiryService.getUnassignedInquiries(pageable);
        }
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "���� �� ��ȸ")
    @GetMapping("/inquiries/{inquiryId}")
    public ResponseEntity<InquiryDetailResponse> getInquiry(
            @PathVariable Long inquiryId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(inquiryService.getInquiry(inquiryId, currentUser));
    }

    @Operation(summary = "���� ����")
    @PostMapping("/inquiries/{inquiryId}/assign")
    public ResponseEntity<InquiryDetailResponse> assignInquiry(
            @PathVariable Long inquiryId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(inquiryService.assignInquiry(inquiryId, currentUser));
    }

    @Operation(summary = "���� �亯 ���")
    @PostMapping("/inquiries/{inquiryId}/replies")
    public ResponseEntity<InquiryDetailResponse> addReply(
            @PathVariable Long inquiryId,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @org.springframework.web.bind.annotation.RequestBody InquiryReplyRequest request) {
        return ResponseEntity.ok(inquiryService.addReply(inquiryId, currentUser, request));
    }

    @Operation(summary = "���� ����")
    @PostMapping("/inquiries/{inquiryId}/resolve")
    public ResponseEntity<InquiryDetailResponse> resolveInquiry(
            @PathVariable Long inquiryId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(inquiryService.resolveInquiry(inquiryId, currentUser));
    }

    @Operation(summary = "����α� ��ȸ")
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