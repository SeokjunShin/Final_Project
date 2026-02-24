package com.mycard.api.controller;

import com.mycard.api.dto.*;
import com.mycard.api.service.MerchantService;
import com.mycard.api.service.PointPolicyService;
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
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 관리자(ADMIN) 전용 API 컨트롤러
 * - 사용자 관리 (상태 변경, 잠금 해제)
 * - 가맹점 관리
 * - 포인트 정책 관리
 * - 공지사항/이벤트 관리
 */
@Tag(name = "Admin", description = "관리자 전용 API")
@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final UserAdminService userAdminService;
    private final MerchantService merchantService;
    private final PointPolicyService pointPolicyService;

    // ===================== 사용자 관리 =====================

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
     * 사용자 계정 잠금 해제
     */
    @Operation(summary = "계정 잠금 해제", description = "잠긴 사용자 계정을 해제합니다.")
    @PostMapping("/users/{userId}/unlock")
    public ResponseEntity<Void> unlockUser(@PathVariable Long userId) {
        userAdminService.unlockUser(userId);
        return ResponseEntity.ok().build();
    }

    // ===================== 가맹점 관리 =====================

    /**
     * 가맹점 목록 조회
     */
    @Operation(summary = "가맹점 목록 조회", description = "전체 가맹점 목록을 조회합니다.")
    @GetMapping("/merchants")
    public ResponseEntity<Page<MerchantResponse>> getMerchants(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "merchantName", direction = Sort.Direction.ASC) Pageable pageable) {

        Page<MerchantResponse> merchants;
        if (keyword != null && !keyword.isEmpty()) {
            merchants = merchantService.searchMerchants(keyword, pageable);
        } else {
            merchants = merchantService.getMerchants(pageable);
        }
        return ResponseEntity.ok(merchants);
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
     * 포인트 정책 값 변경
     */
    @Operation(summary = "포인트 정책 값 변경", description = "포인트 정책의 값을 변경합니다.")
    @PatchMapping("/point-policies/{policyId}")
    public ResponseEntity<PointPolicyResponse> updatePointPolicy(
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
}
