package com.mycard.api.controller;

import com.mycard.api.dto.dashboard.DashboardSummaryResponse;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "대시보드", description = "대시보드 API")
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @Operation(summary = "대시보드 요약 정보 조회")
    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getSummary(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        DashboardSummaryResponse response = dashboardService.getDashboardSummary(currentUser);
        return ResponseEntity.ok(response);
    }
}
