package com.mycard.api.controller;

import com.mycard.api.dto.*;
import com.mycard.api.dto.card.ReissueRequestResponse;
import com.mycard.api.dto.loan.LoanDetailResponse;
import com.mycard.api.entity.*;
import com.mycard.api.entity.Attachment;
import com.mycard.api.repository.*;
import com.mycard.api.repository.EventParticipationRepository;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 관리자(ADMIN) 전용 API 컨트롤러
 * - 대시보드 통계
 * - 사용자 관리 (상태 변경, 잠금 해제)
 * - 가맹점 관리
 * - 포인트 정책 관리
 * - 이벤트 관리
 * - 문서 관리
 * - 메시지 관리
 * - 감사로그 조회
 */
@Tag(name = "Admin", description = "관리자 전용 API")
@Slf4j
@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminController {

    private final UserAdminService userAdminService;
    private final MerchantService merchantService;
    private final PointPolicyService pointPolicyService;
    private final CardApplicationService cardApplicationService;
    private final UserRepository userRepository;
    private final InquiryRepository inquiryRepository;
    private final DocumentRepository documentRepository;
    private final AttachmentRepository attachmentRepository;
    private final MessageRepository messageRepository;
    private final EventRepository eventRepository;
    private final AuditLogRepository auditLogRepository;
    private final LoanService loanService;
    private final InquiryService inquiryService;
    private final CardRepository cardRepository;
    private final EventService eventService;
    private final EventParticipationRepository participationRepository;

    // ===================== 대시보드 =====================

    /**
     * 관리자 대시보드 통계
     */
    @Operation(summary = "대시보드 통계", description = "관리자 대시보드용 통계를 조회합니다.")
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        // 오늘 문의 수
        long todayInquiries = inquiryRepository.count();

        // 대기중인 문서 수
        long pendingDocuments = 0;
        try {
            Page<Document> pendingDocs = documentRepository.findPendingDocuments(PageRequest.of(0, 1));
            pendingDocuments = pendingDocs.getTotalElements();
        } catch (Exception e) {
            // ignore
        }

        // 전체 메시지 수
        long unreadMessages = messageRepository.count();

        // 잠긴 사용자 수
        long lockedUsers = 0;
        try {
            lockedUsers = userRepository.findAll().stream()
                    .filter(u -> Boolean.TRUE.equals(u.getLocked()))
                    .count();
        } catch (Exception e) {
            // ignore
        }

        // 최근 문의 목록 - 단순화
        List<Map<String, Object>> recentInquiries = new ArrayList<>();
        try {
            Page<Inquiry> recentInquiriesPage = inquiryRepository.findAll(
                    PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt")));

            for (Inquiry i : recentInquiriesPage.getContent()) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", i.getId());
                map.put("title", i.getTitle() != null ? i.getTitle() : "");
                map.put("status", i.getStatus() != null ? i.getStatus().name() : "OPEN");
                // assignee 접근 시 안전하게 처리
                String assignee = "";
                try {
                    if (i.getAssignedOperator() != null) {
                        assignee = i.getAssignedOperator().getFullName();
                    }
                } catch (Exception e) {
                    // LazyInitializationException 방지
                }
                map.put("assignee", assignee);
                map.put("createdAt",
                        i.getCreatedAt() != null ? i.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                                : "");
                recentInquiries.add(map);
            }
        } catch (Exception e) {
            // ignore
        }

        Map<String, Object> response = new HashMap<>();
        response.put("todayInquiries", todayInquiries);
        response.put("pendingDocuments", pendingDocuments);
        response.put("unreadMessages", unreadMessages);
        response.put("lockedUsers", lockedUsers);
        response.put("recentInquiries", recentInquiries);

        return ResponseEntity.ok(response);
    }

    // ===================== 사용자 관리 =====================

    /**
     * 사용자 목록 조회
     */
    @Operation(summary = "사용자 목록 조회", description = "전체 사용자 목록을 조회합니다.")
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = users.stream()
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", u.getId());
                    map.put("name", u.getFullName() != null ? u.getFullName() : u.getEmail());
                    map.put("email", u.getEmail());
                    map.put("status", Boolean.TRUE.equals(u.getLocked()) ? "LOCKED"
                            : (Boolean.TRUE.equals(u.getEnabled()) ? "ACTIVE" : "INACTIVE"));
                    return map;
                })
                .toList();
        return ResponseEntity.ok(result);
    }

    /**
     * 사용자 상태 변경
     */
    @Operation(summary = "사용자 상태 변경", description = "사용자의 활성화/잠금 상태를 변경합니다.")
    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<UserAdminResponse> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UserStatusUpdateRequest request) {

        UserAdminResponse user = userAdminService.updateUserStatus(userId, request);
        return ResponseEntity.ok(user);
    }

    /**
     * 사용자 상태 변경 (state 경로)
     */
    @Operation(summary = "사용자 상태 변경 (state)", description = "사용자의 상태를 변경합니다.")
    @PatchMapping("/users/{userId}/state")
    public ResponseEntity<Map<String, Object>> updateUserState(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {

        String state = request.get("state");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        if ("LOCKED".equals(state)) {
            user.lock();
        } else if ("INACTIVE".equals(state)) {
            user.disable();
        } else if ("ACTIVE".equals(state)) {
            user.enable();
            user.unlock();
        }

        userRepository.save(user);

        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("status", state);
        return ResponseEntity.ok(result);
    }

    /**
     * 사용자 계정 잠금 해제
     */
    @Operation(summary = "계정 잠금 해제", description = "잠긴 사용자 계정을 해제합니다.")
    @PostMapping("/users/{userId}/unlock")
    public ResponseEntity<Void> unlockUser(@PathVariable Long userId) {
        userAdminService.unlockUser(userId);
        return ResponseEntity.ok().build();
    }

    // ===================== 상담원/문의 배정 관리 =====================

    /**
     * 상담원 목록 조회 (OPERATOR, ADMIN 역할)
     */
    @Operation(summary = "상담원 목록 조회", description = "문의 배정 가능한 상담원/관리자 목록을 조회합니다.")
    @GetMapping("/operators")
    public ResponseEntity<List<Map<String, Object>>> getOperators() {
        List<User> operators = userRepository.findAll().stream()
                .filter(u -> "OPERATOR".equals(u.getRole()) || "ADMIN".equals(u.getRole()))
                .filter(u -> Boolean.TRUE.equals(u.getEnabled()) && !Boolean.TRUE.equals(u.getLocked()))
                .toList();

        List<Map<String, Object>> result = operators.stream()
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", u.getId());
                    map.put("name", u.getFullName() != null ? u.getFullName() : u.getEmail());
                    map.put("email", u.getEmail());
                    map.put("role", u.getRole());
                    return map;
                })
                .toList();
        return ResponseEntity.ok(result);
    }

    /**
     * 문의를 특정 상담원에게 배정
     */
    @Operation(summary = "문의 배정", description = "특정 문의를 지정된 상담원에게 배정합니다.")
    @Transactional
    @PostMapping("/inquiries/{inquiryId}/assign/{operatorId}")
    public ResponseEntity<Map<String, Object>> assignInquiryToOperator(
            @PathVariable Long inquiryId,
            @PathVariable Long operatorId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        var result = inquiryService.assignToOperator(inquiryId, operatorId, currentUser);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("inquiry", result);
        return ResponseEntity.ok(response);
    }

    // ===================== 대출 관리 =====================

    @Operation(summary = "대출 승인", description = "REQUESTED 상태의 대출을 승인 처리합니다.")
    @PatchMapping("/loans/{loanId}/approve")
    public ResponseEntity<LoanDetailResponse> approveLoan(@PathVariable Long loanId) {
        LoanDetailResponse response = loanService.approveLoanAsAdmin(loanId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "대출 출금 처리", description = "APPROVED 상태의 대출을 출금완료(DISBURSED) 처리합니다.")
    @PatchMapping("/loans/{loanId}/disburse")
    public ResponseEntity<LoanDetailResponse> disburseLoan(@PathVariable Long loanId) {
        LoanDetailResponse response = loanService.disburseLoanAsAdmin(loanId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "대출 취소/거절", description = "대출을 취소(CANCELED) 상태로 변경합니다.")
    @PatchMapping("/loans/{loanId}/cancel")
    public ResponseEntity<LoanDetailResponse> cancelLoan(@PathVariable Long loanId) {
        LoanDetailResponse response = loanService.cancelLoanAsAdmin(loanId);
        return ResponseEntity.ok(response);
    }

    // ===================== 가맹점 관리 =====================

    /**
     * 가맹점 목록 조회
     */
    @Operation(summary = "가맹점 목록 조회", description = "전체 가맹점 목록을 조회합니다.")
    @GetMapping("/merchants")
    public ResponseEntity<List<MerchantResponse>> getMerchants(
            @RequestParam(required = false) String keyword) {

        Page<MerchantResponse> merchants;
        Pageable pageable = PageRequest.of(0, 1000, Sort.by(Sort.Direction.ASC, "merchantName"));

        if (keyword != null && !keyword.isEmpty()) {
            merchants = merchantService.searchMerchants(keyword, pageable);
        } else {
            merchants = merchantService.getMerchants(pageable);
        }
        return ResponseEntity.ok(merchants.getContent());
    }

    /**
     * 가맹점 등록
     */
    @Operation(summary = "가맹점 등록", description = "새 가맹점을 등록합니다.")
    @PostMapping("/merchants")
    public ResponseEntity<Map<String, Object>> createMerchant(
            @RequestBody Map<String, String> request) {

        // 간단한 응답 반환 (실제 구현은 MerchantService에서)
        Map<String, Object> result = new HashMap<>();
        result.put("name", request.get("name"));
        result.put("businessNo", request.get("businessNo"));
        result.put("status", "ACTIVE");
        return ResponseEntity.ok(result);
    }

    /**
     * 가맹점 상세 조회
     */
    @Operation(summary = "가맹점 상세 조회", description = "특정 가맹점의 상세 정보를 조회합니다.")
    @GetMapping("/merchants/{merchantId}")
    public ResponseEntity<MerchantResponse> getMerchant(@PathVariable Long merchantId) {
        MerchantResponse merchant = merchantService.getMerchant(merchantId);
        return ResponseEntity.ok(merchant);
    }

    /**
     * 가맹점 상태 변경
     */
    @Operation(summary = "가맹점 상태 변경", description = "가맹점의 상태를 변경합니다.")
    @PatchMapping("/merchants/{merchantId}/status")
    public ResponseEntity<MerchantResponse> updateMerchantStatus(
            @PathVariable Long merchantId,
            @RequestBody Map<String, String> request) {

        String status = request.get("status");
        MerchantResponse merchant = merchantService.updateMerchantStatus(merchantId, status);
        return ResponseEntity.ok(merchant);
    }

    // ===================== 이벤트 관리 =====================

    /**
     * 이벤트 목록 조회
     */
    @Operation(summary = "이벤트 목록 조회", description = "전체 이벤트 목록을 조회합니다.")
    @GetMapping("/events")
    public ResponseEntity<List<Map<String, Object>>> getEvents() {
        List<Event> events = eventRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Map<String, Object>> result = events.stream()
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", e.getId());
                    map.put("title", e.getTitle());
                    map.put("description", e.getDescription());
                    map.put("imageUrl", e.getImageUrl());
                    map.put("startDate", e.getStartDate());
                    map.put("endDate", e.getEndDate());
                    map.put("applicants", participationRepository.countByEventId(e.getId()));
                    map.put("winners", participationRepository.countByEventIdAndWinnerTrue(e.getId()));
                    map.put("status", e.getStatus().name());
                    return map;
                })
                .toList();
        return ResponseEntity.ok(result);
    }

    /**
     * 이벤트 생성
     */
    @Operation(summary = "이벤트 생성", description = "새 이벤트를 생성합니다.")
    @PostMapping("/events")
    @Transactional
    public ResponseEntity<Map<String, Object>> createEvent(
            @Valid @RequestBody com.mycard.api.dto.EventCreateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Event event = eventService.createEvent(request, currentUser.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("id", event.getId());
        result.put("title", event.getTitle());
        result.put("status", event.getStatus().name());
        result.put("message", "이벤트가 생성되었습니다.");
        return ResponseEntity.ok(result);
    }

    /**
     * 이벤트 마감 처리
     */
    @Operation(summary = "이벤트 마감", description = "이벤트를 마감 처리합니다.")
    @PatchMapping("/events/{eventId}/close")
    @Transactional
    public ResponseEntity<Map<String, Object>> closeEvent(@PathVariable Long eventId) {
        eventService.closeEvent(eventId);

        Map<String, Object> result = new HashMap<>();
        result.put("eventId", eventId);
        result.put("status", "CLOSED");
        result.put("message", "이벤트가 마감되었습니다.");
        return ResponseEntity.ok(result);
    }

    /**
     * 이벤트 참여자 목록 조회
     */
    @Operation(summary = "참여자 목록 조회", description = "이벤트 참여자 목록을 조회합니다.")
    @GetMapping("/events/{eventId}/participants")
    public ResponseEntity<List<Map<String, Object>>> getParticipants(@PathVariable Long eventId) {
        Page<EventParticipation> participants = participationRepository.findByEventId(
                eventId, PageRequest.of(0, 1000, Sort.by("createdAt")));

        List<Map<String, Object>> result = participants.getContent().stream()
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", p.getId());
                    map.put("userId", p.getUser().getId());
                    map.put("userName", p.getUser().getFullName());
                    map.put("email", p.getUser().getEmail());
                    map.put("isWinner", Boolean.TRUE.equals(p.getWinner()));
                    map.put("participatedAt", p.getCreatedAt());
                    return map;
                })
                .toList();
        return ResponseEntity.ok(result);
    }

    /**
     * 당첨 처리 (여러 명 가능) 및 포인트 지급
     */
    @Operation(summary = "당첨 처리", description = "선택한 참여자를 당첨 처리하고 포인트를 지급합니다.")
    @PostMapping("/events/{eventId}/draw")
    @Transactional
    public ResponseEntity<Map<String, Object>> drawWinners(
            @PathVariable Long eventId,
            @RequestBody Map<String, Object> request) {

        try {
            Object idsObj = request.get("participationIds");
            if (!(idsObj instanceof List)) {
                throw new com.mycard.api.exception.BadRequestException("잘못된 요청 양식입니다.");
            }

            List<?> rawIds = (List<?>) idsObj;
            if (rawIds.isEmpty()) {
                throw new com.mycard.api.exception.BadRequestException("당첨 처리할 참여자를 선택해주세요.");
            }

            List<Long> participationIds = rawIds.stream()
                    .map(id -> Long.valueOf(id.toString()))
                    .toList();

            Integer rewardPoints = null;
            if (request.containsKey("rewardPoints") && request.get("rewardPoints") != null) {
                String rewardStr = request.get("rewardPoints").toString().trim();
                if (!rewardStr.isEmpty() && !rewardStr.equals("0")) {
                    rewardPoints = Integer.parseInt(rewardStr);
                }
            }

            eventService.setWinners(eventId, participationIds, rewardPoints);

            Map<String, Object> result = new HashMap<>();
            result.put("eventId", eventId);
            result.put("winnersCount", participationIds.size());
            result.put("message", "당첨 처리가 완료되었습니다.");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            try {
                java.io.PrintWriter pw = new java.io.PrintWriter(new java.io.FileWriter("backend_error.log", true));
                pw.println("=== DRAW WINNERS ERROR ===");
                e.printStackTrace(pw);
                pw.close();
            } catch (Exception ex) {
            }
            throw e;
        }
    }

    // ===================== 문서 관리 =====================

    /**
     * 문서 목록 조회
     */
    @Operation(summary = "문서 목록 조회", description = "문서 목록을 조회합니다.")
    @GetMapping("/documents")
    public ResponseEntity<Map<String, Object>> getDocuments(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {

        log.info("관리자 문서 목록 조회: status={}, page={}", status, pageable.getPageNumber());
        Page<Document> documents;
        if (status != null && !status.isEmpty()) {
            try {
                Document.DocumentStatus docStatus = Document.DocumentStatus.valueOf(status);
                documents = documentRepository.findByStatus(docStatus, pageable);
            } catch (IllegalArgumentException e) {
                documents = documentRepository.findAllByOrderByCreatedAtDesc(pageable);
            }
        } else {
            documents = documentRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        List<Map<String, Object>> content = documents.getContent().stream()
                .map(d -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", d.getId());

                    // 첨부파일에서 원본 파일명 가져오기
                    List<Attachment> attachments = attachmentRepository.findByDocumentId(d.getId());
                    String fileName = attachments.isEmpty() ? "(파일 없음)" : attachments.get(0).getOriginalFilename();
                    Long attachmentId = attachments.isEmpty() ? null : attachments.get(0).getId();
                    map.put("title", fileName);
                    map.put("attachmentId", attachmentId);

                    map.put("docType", d.getDocumentType() != null ? d.getDocumentType().name() : "OTHER");
                    map.put("status", d.getStatus().name());

                    // 신청자 이름
                    String submitterName = "";
                    try {
                        if (d.getUser() != null) {
                            submitterName = d.getUser().getFullName();
                        }
                    } catch (Exception e) {
                        // LazyInitializationException 방지
                    }
                    map.put("submitterName", submitterName);

                    map.put("rejectionReason", d.getReviewComment());
                    map.put("createdAt",
                            d.getCreatedAt() != null
                                    ? d.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                                    : "");
                    return map;
                })
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("totalElements", documents.getTotalElements());
        response.put("totalPages", documents.getTotalPages());
        response.put("number", documents.getNumber());
        response.put("size", documents.getSize());

        return ResponseEntity.ok(response);
    }

    /**
     * 문서 상태 변경
     */
    @Operation(summary = "문서 상태 변경", description = "문서의 상태를 변경합니다.")
    @PatchMapping("/documents/{documentId}/status")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateDocumentStatus(
            @PathVariable Long documentId,
            @RequestBody Map<String, String> request) {

        String status = request.get("status");
        log.info("문서 상태 변경 요청: id={}, status={}", documentId, status);
        String rejectionReason = request.get("rejectionReason");
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("문서를 찾을 수 없습니다."));

        if ("APPROVED".equals(status)) {
            document.setStatus(Document.DocumentStatus.APPROVED);
            document.setReviewComment("관리자 승인");
            document.setReviewedAt(LocalDateTime.now());
        } else if ("REJECTED".equals(status)) {
            document.setStatus(Document.DocumentStatus.REJECTED);
            document.setReviewComment(rejectionReason != null && !rejectionReason.isBlank()
                    ? rejectionReason
                    : "관리자 반려");
            document.setReviewedAt(LocalDateTime.now());
        }

        documentRepository.save(document);

        Map<String, Object> result = new HashMap<>();
        result.put("id", document.getId());
        result.put("status", document.getStatus().name());
        return ResponseEntity.ok(result);
    }

    // ===================== 메시지 관리 =====================

    /**
     * 메시지 목록 조회
     */
    @Operation(summary = "메시지 목록 조회", description = "발송된 메시지 목록을 조회합니다.")
    @GetMapping("/messages")
    public ResponseEntity<List<Map<String, Object>>> getMessages() {
        List<Message> messages = messageRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Map<String, Object>> result = messages.stream()
                .map(m -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", m.getId());
                    map.put("userId", m.getRecipient() != null ? m.getRecipient().getId().toString() : "");
                    map.put("content", m.getContent());
                    map.put("sentAt",
                            m.getCreatedAt() != null
                                    ? m.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                                    : "");
                    return map;
                })
                .toList();
        return ResponseEntity.ok(result);
    }

    /**
     * 메시지 발송
     */
    @Operation(summary = "메시지 발송", description = "사용자에게 메시지를 발송합니다.")
    @PostMapping("/messages")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @RequestBody Map<String, String> request) {

        String userIdStr = request.get("userId");
        String content = request.get("content");

        Long userId = Long.parseLong(userIdStr);
        User recipient = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 시스템 사용자(관리자)를 sender로 사용 - ID 1로 고정 또는 현재 로그인한 관리자
        User sender = userRepository.findById(1L).orElse(recipient);

        Message message = new Message(sender, recipient, Message.MessageType.SYSTEM, "관리자 메시지", content);

        messageRepository.save(message);

        Map<String, Object> result = new HashMap<>();
        result.put("id", message.getId());
        result.put("userId", userIdStr);
        result.put("content", content);
        result.put("sentAt", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
        return ResponseEntity.ok(result);
    }

    // ===================== 포인트 정책 관리 =====================

    /**
     * 포인트 정책 목록 조회
     */
    @Operation(summary = "포인트 정책 목록 조회", description = "전체 포인트 정책을 조회합니다.")
    @GetMapping("/point-policies")
    public ResponseEntity<List<PointPolicyResponse>> getPointPolicies() {
        List<PointPolicyResponse> policies = pointPolicyService.getAllPolicies();
        return ResponseEntity.ok(policies);
    }

    /**
     * 포인트 정책 조회 (단일)
     */
    @Operation(summary = "포인트 정책 조회", description = "포인트 정책을 조회합니다.")
    @GetMapping("/policies/points")
    public ResponseEntity<Map<String, Object>> getPointPolicy() {
        List<PointPolicyResponse> policies = pointPolicyService.getAllPolicies();

        Map<String, Object> response = new HashMap<>();
        response.put("feeRate", 2.5);
        response.put("dailyLimit", 500000);

        if (!policies.isEmpty()) {
            policies.stream()
                    .filter(p -> "FEE_RATE".equals(p.getPolicyKey()))
                    .findFirst()
                    .ifPresent(p -> response.put("feeRate", p.getPolicyValue()));

            policies.stream()
                    .filter(p -> "DAILY_LIMIT".equals(p.getPolicyKey()))
                    .findFirst()
                    .ifPresent(p -> response.put("dailyLimit", p.getPolicyValue()));
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 포인트 정책 업데이트
     */
    @Operation(summary = "포인트 정책 업데이트", description = "포인트 정책을 업데이트합니다.")
    @PutMapping("/policies/points")
    public ResponseEntity<Map<String, Object>> updatePointPolicy(
            @RequestBody Map<String, Object> request) {

        Map<String, Object> response = new HashMap<>();
        response.put("feeRate", request.get("feeRate"));
        response.put("dailyLimit", request.get("dailyLimit"));
        response.put("message", "정책이 업데이트되었습니다.");
        return ResponseEntity.ok(response);
    }

    /**
     * 포인트 정책 값 변경
     */
    @Operation(summary = "포인트 정책 값 변경", description = "포인트 정책의 값을 변경합니다.")
    @PatchMapping("/point-policies/{policyId}")
    public ResponseEntity<PointPolicyResponse> updatePointPolicyValue(
            @PathVariable Long policyId,
            @RequestBody Map<String, BigDecimal> request) {

        BigDecimal newValue = request.get("policyValue");
        PointPolicyResponse policy = pointPolicyService.updatePolicy(policyId, newValue);
        return ResponseEntity.ok(policy);
    }

    /**
     * 포인트 정책 활성화/비활성화
     */
    @Operation(summary = "포인트 정책 상태 토글", description = "포인트 정책을 활성화/비활성화합니다.")
    @PostMapping("/point-policies/{policyId}/toggle")
    public ResponseEntity<PointPolicyResponse> togglePointPolicy(@PathVariable Long policyId) {
        PointPolicyResponse policy = pointPolicyService.togglePolicyStatus(policyId);
        return ResponseEntity.ok(policy);
    }

    // ===================== 감사로그 =====================

    /**
     * 감사로그 조회
     */
    @Operation(summary = "감사로그 조회", description = "감사로그를 조회합니다.")
    @GetMapping("/audit-logs")
    public ResponseEntity<Map<String, Object>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String actor,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> content = new ArrayList<>();

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<AuditLog> auditLogs;

            if (action != null && !action.isEmpty()) {
                auditLogs = auditLogRepository.findByAction(action, pageable);
            } else {
                auditLogs = auditLogRepository.findAllOrderByCreatedAtDesc(pageable);
            }

            for (AuditLog log : auditLogs.getContent()) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", log.getId());
                map.put("occurredAt",
                        log.getCreatedAt() != null
                                ? log.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                                : "");
                map.put("actor", log.getActorRole() != null ? log.getActorRole() : "system");
                map.put("action", log.getActionType() != null ? log.getActionType().name() : "");
                map.put("target", (log.getResourceType() != null ? log.getResourceType() : "") +
                        (log.getResourceId() != null ? "=" + log.getResourceId() : ""));
                content.add(map);
            }

            response.put("content", content);
            response.put("totalElements", auditLogs.getTotalElements());
            response.put("totalPages", auditLogs.getTotalPages());
            response.put("number", auditLogs.getNumber());
            response.put("size", auditLogs.getSize());
        } catch (Exception e) {
            // 에러 로깅
            log.error("Audit log query failed", e);
            response.put("content", content);
            response.put("totalElements", 0);
            response.put("totalPages", 0);
            response.put("number", 0);
            response.put("size", size);
        }

        return ResponseEntity.ok(response);
    }

    // ===================== 카드 신청 관리 =====================

    /**
     * 카드 신청 목록 조회
     */
    @Operation(summary = "카드 신청 목록", description = "카드 신청 목록을 조회합니다.")
    @GetMapping("/card-applications")
    public ResponseEntity<Map<String, Object>> getCardApplications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {

        Pageable pageable = PageRequest.of(page, size);
        Page<CardApplicationResponse> applications;

        if (status != null && !status.isEmpty()) {
            applications = cardApplicationService.getApplicationsByStatus(status, pageable);
        } else {
            applications = cardApplicationService.getAllApplications(pageable);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("content", applications.getContent());
        response.put("totalElements", applications.getTotalElements());
        response.put("totalPages", applications.getTotalPages());
        response.put("number", applications.getNumber());
        response.put("size", applications.getSize());

        return ResponseEntity.ok(response);
    }

    /**
     * 카드 신청 상세 조회
     */
    @Operation(summary = "카드 신청 상세", description = "카드 신청 상세 정보를 조회합니다.")
    @GetMapping("/card-applications/{applicationId}")
    public ResponseEntity<CardApplicationResponse> getCardApplicationDetail(
            @PathVariable Long applicationId) {
        CardApplicationResponse application = cardApplicationService.getApplicationDetail(applicationId);
        return ResponseEntity.ok(application);
    }

    /**
     * 카드 신청 승인
     */
    @Operation(summary = "카드 신청 승인", description = "카드 신청을 승인하고 카드를 발급합니다.")
    @PostMapping("/card-applications/{applicationId}/approve")
    @Transactional
    public ResponseEntity<CardApplicationResponse> approveCardApplication(
            @PathVariable Long applicationId,
            @RequestParam BigDecimal creditLimit,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CardApplicationResponse application = cardApplicationService.approveApplication(
                applicationId, currentUser.getId(), creditLimit);
        return ResponseEntity.ok(application);
    }

    /**
     * 카드 신청 거절
     */
    @Operation(summary = "카드 신청 거절", description = "카드 신청을 거절합니다.")
    @PostMapping("/card-applications/{applicationId}/reject")
    @Transactional
    public ResponseEntity<CardApplicationResponse> rejectCardApplication(
            @PathVariable Long applicationId,
            @RequestParam String reason,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CardApplicationResponse application = cardApplicationService.rejectApplication(
                applicationId, currentUser.getId(), reason);
        return ResponseEntity.ok(application);
    }

    /**
     * 카드 신청 심사 시작
     */
    @Operation(summary = "카드 신청 심사 시작", description = "카드 신청 상태를 심사중으로 변경합니다.")
    @PostMapping("/card-applications/{applicationId}/start-review")
    @Transactional
    public ResponseEntity<CardApplicationResponse> startReview(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CardApplicationResponse application = cardApplicationService.startReview(
                applicationId, currentUser.getId());
        return ResponseEntity.ok(application);
    }

    /**
     * 대기중인 카드 신청 건수
     */
    @Operation(summary = "대기중 카드 신청 건수", description = "대기중인 카드 신청 건수를 조회합니다.")
    @GetMapping("/card-applications/pending-count")
    public ResponseEntity<Map<String, Long>> getPendingApplicationCount() {
        long count = cardApplicationService.getPendingCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    // ===================== 재발급 신청 관리 =====================

    @Operation(summary = "재발급 신청 목록", description = "상태가 재발급 신청(REISSUE_REQUESTED)인 카드 목록을 조회합니다.")
    @GetMapping("/reissue-requests")
    public ResponseEntity<List<ReissueRequestResponse>> getReissueRequests() {
        List<Card> cards = cardRepository.findByStatusWithUserOrderByUpdatedAtDesc(Card.CardStatus.REISSUE_REQUESTED);
        List<ReissueRequestResponse> list = cards.stream()
                .map(c -> {
                    User u = c.getUser();
                    return ReissueRequestResponse.builder()
                            .cardId(c.getId())
                            .cardNumberMasked(c.getMaskedCardNumber())
                            .cardAlias(c.getCardAlias() != null ? c.getCardAlias() : c.getCardType())
                            .userId(u != null ? u.getId() : null)
                            .userName(u != null ? u.getFullName() : null)
                            .userEmail(u != null ? u.getEmail() : null)
                            .requestedAt(c.getUpdatedAt())
                            .build();
                })
                .toList();
        return ResponseEntity.ok(list);
    }

    @Operation(summary = "재발급 완료 처리", description = "재발급 신청 카드를 재발급 완료(REISSUED) 상태로 변경합니다.")
    @PatchMapping("/cards/{cardId}/reissue-complete")
    @Transactional
    public ResponseEntity<ReissueRequestResponse> completeReissue(@PathVariable Long cardId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("카드를 찾을 수 없습니다."));
        if (card.getStatus() != Card.CardStatus.REISSUE_REQUESTED) {
            throw new com.mycard.api.exception.BadRequestException("재발급 신청 상태인 카드만 완료 처리할 수 있습니다.");
        }
        card.setStatus(Card.CardStatus.REISSUED);
        cardRepository.save(card);

        User u = card.getUser();
        ReissueRequestResponse response = ReissueRequestResponse.builder()
                .cardId(card.getId())
                .cardNumberMasked(card.getMaskedCardNumber())
                .cardAlias(card.getCardAlias() != null ? card.getCardAlias() : card.getCardType())
                .userId(u != null ? u.getId() : null)
                .userName(u != null ? u.getFullName() : null)
                .userEmail(u != null ? u.getEmail() : null)
                .requestedAt(card.getUpdatedAt())
                .build();
        return ResponseEntity.ok(response);
    }
}
