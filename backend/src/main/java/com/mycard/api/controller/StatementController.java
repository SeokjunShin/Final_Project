package com.mycard.api.controller;

import com.mycard.api.dto.StatementDetailResponse;
import com.mycard.api.dto.StatementListResponse;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.StatementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

@Tag(name = "Statements", description = "명세서 API (Owner check: service layer)")
@RestController
@RequestMapping("/statements")
@RequiredArgsConstructor
public class StatementController {

    private final StatementService statementService;

    @Operation(summary = "명세서 목록 조회", description = "USER/OPERATOR/ADMIN 접근 가능")
    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'OPERATOR', 'ADMIN')")
    public ResponseEntity<Page<StatementListResponse>> getStatements(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) Long cardId,
            @PageableDefault(sort = "periodStart", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<StatementListResponse> statements = statementService.getStatements(
                userPrincipal.getId(), fromDate, toDate, cardId, pageable);
        return ResponseEntity.ok(statements);
    }

    @Operation(summary = "명세서 상세 조회", description = "Owner check는 서비스에서 강제")
    @GetMapping("/{statementId}")
    @PreAuthorize("hasAnyRole('USER', 'OPERATOR', 'ADMIN')")
    public ResponseEntity<StatementDetailResponse> getStatementDetail(
            @PathVariable Long statementId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        StatementDetailResponse detail = statementService.getStatementDetail(statementId, userPrincipal);
        return ResponseEntity.ok(detail);
    }

    @Operation(summary = "명세서 CSV 다운로드", description = "Owner check 후 스트리밍")
    @GetMapping("/{statementId}/export.csv")
    @PreAuthorize("hasAnyRole('USER', 'OPERATOR', 'ADMIN')")
    public ResponseEntity<byte[]> exportStatementCsv(
            @PathVariable Long statementId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        String csv = statementService.exportStatementCsv(statementId, userPrincipal);

        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=statement-" + statementId + ".csv")
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }
}
