package com.mycard.api.controller;

import com.mycard.api.dto.point.*;
import com.mycard.api.entity.PointLedger;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.PointService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "포인트", description = "포인트 관리 API")
@RestController
@RequestMapping("/points")
@RequiredArgsConstructor
public class PointController {

    private final PointService pointService;

    @Operation(summary = "포인트 잔액 조회")
    @GetMapping("/balance")
    public ResponseEntity<PointBalanceResponse> getBalance(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        PointBalanceResponse response = pointService.getBalance(currentUser);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "포인트 내역 조회")
    @GetMapping("/ledger")
    public ResponseEntity<Page<PointLedgerResponse>> getLedger(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) PointLedger.TransactionType type,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PointLedgerResponse> response;
        if (type != null) {
            response = pointService.getLedgerByType(currentUser, type, pageable);
        } else {
            response = pointService.getLedger(currentUser, pageable);
        }
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "포인트 전환 (현금화)")
    @PostMapping("/convert")
    public ResponseEntity<PointWithdrawalResponse> convert(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody PointConversionRequest request) {
        PointWithdrawalResponse response = pointService.convertToMoney(currentUser, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "전환 내역 조회")
    @GetMapping("/withdrawals")
    public ResponseEntity<Page<PointWithdrawalResponse>> getWithdrawals(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PointWithdrawalResponse> response = pointService.getWithdrawals(currentUser, pageable);
        return ResponseEntity.ok(response);
    }
}
