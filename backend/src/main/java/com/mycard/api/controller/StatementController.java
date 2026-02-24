package com.mycard.api.controller;

import com.mycard.api.dto.StatementDetailResponse;
import com.mycard.api.dto.StatementListResponse;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.OwnerCheckService;
import com.mycard.api.service.StatementService;
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
import org.springframework.web.bind.annotation.*;

/**
 * 청구서 API 컨트롤러
 */
@Tag(name = "Statements", description = "청구서 관리 API")
@RestController
@RequestMapping("/statements")
@RequiredArgsConstructor
public class StatementController {

    private final StatementService statementService;
    private final OwnerCheckService ownerCheckService;

    /**
     * 내 청구서 목록 조회
     */
    @Operation(summary = "청구서 목록 조회", description = "로그인한 사용자의 청구서 목록을 조회합니다.")
    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'OPERATOR', 'ADMIN')")
    public ResponseEntity<Page<StatementListResponse>> getStatements(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PageableDefault(sort = "year", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<StatementListResponse> statements = statementService.getStatements(
                userPrincipal.getId(), pageable);
        return ResponseEntity.ok(statements);
    }

    /**
     * 청구서 상세 조회
     */
    @Operation(summary = "청구서 상세 조회", description = "특정 청구서의 상세 내역을 조회합니다.")
    @GetMapping("/{statementId}")
    @PreAuthorize("hasAnyRole('USER', 'OPERATOR', 'ADMIN')")
    public ResponseEntity<StatementDetailResponse> getStatementDetail(
            @PathVariable Long statementId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        // 소유자 확인
        ownerCheckService.checkStatementOwner(statementId, userPrincipal);

        StatementDetailResponse detail = statementService.getStatementDetail(statementId);
        return ResponseEntity.ok(detail);
    }
}
