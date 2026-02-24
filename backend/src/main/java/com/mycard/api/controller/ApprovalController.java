package com.mycard.api.controller;

import com.mycard.api.dto.ApprovalResponse;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.ApprovalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@Tag(name = "Approvals", description = "승인/취소 내역 API")
@RestController
@RequestMapping("/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    @Operation(summary = "승인/취소 목록 조회", description = "USER/OPERATOR/ADMIN 접근 가능")
    @GetMapping
    @PreAuthorize("hasAnyRole('USER','OPERATOR','ADMIN')")
    public ResponseEntity<Page<ApprovalResponse>> getApprovals(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) Long cardId,
            @PageableDefault(size = 20, sort = "approvedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(approvalService.getApprovals(principal.getId(), fromDate, toDate, cardId, pageable));
    }
}
