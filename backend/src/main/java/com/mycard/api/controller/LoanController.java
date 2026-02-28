package com.mycard.api.controller;

import com.mycard.api.dto.loan.*;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.LoanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "대출", description = "대출 API")
@RestController
@RequestMapping("/loans")
@PreAuthorize("hasAnyRole('USER','OPERATOR','REVIEW_ADMIN','MASTER_ADMIN')")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @Operation(summary = "내 대출 목록 조회")
    @GetMapping
    public ResponseEntity<Page<LoanListResponse>> getMyLoans(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<LoanListResponse> response = loanService.getMyLoans(currentUser, pageable);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "대출 상세 조회")
    @GetMapping("/{loanId}")
    public ResponseEntity<LoanDetailResponse> getLoan(
            @PathVariable Long loanId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        LoanDetailResponse response = loanService.getLoan(loanId, currentUser);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "대출 등록")
    @PostMapping
    public ResponseEntity<LoanDetailResponse> createLoan(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody LoanCreateRequest request) {
        LoanDetailResponse response = loanService.createLoan(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
