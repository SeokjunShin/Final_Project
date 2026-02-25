package com.mycard.api.controller;

import com.mycard.api.dto.CardApplicationRequest;
import com.mycard.api.dto.CardApplicationResponse;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.CardApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 사용자용 카드 신청 API
 */
@Tag(name = "카드 신청", description = "카드 신청 API")
@RestController
@RequestMapping("/card-applications")
@RequiredArgsConstructor
public class CardApplicationController {
    
    private final CardApplicationService cardApplicationService;
    
    @Operation(summary = "카드 신청")
    @PostMapping
    public ResponseEntity<CardApplicationResponse> createApplication(
            @Valid @RequestBody CardApplicationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CardApplicationResponse response = cardApplicationService.createApplication(
                currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @Operation(summary = "내 신청 목록 조회")
    @GetMapping
    public ResponseEntity<List<CardApplicationResponse>> getMyApplications(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<CardApplicationResponse> applications = 
                cardApplicationService.getMyApplications(currentUser.getId());
        return ResponseEntity.ok(applications);
    }
    
    @Operation(summary = "내 신청 상세 조회")
    @GetMapping("/{applicationId}")
    public ResponseEntity<CardApplicationResponse> getMyApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CardApplicationResponse application = 
                cardApplicationService.getMyApplication(currentUser.getId(), applicationId);
        return ResponseEntity.ok(application);
    }
    
    @Operation(summary = "신청 취소")
    @DeleteMapping("/{applicationId}")
    public ResponseEntity<Map<String, String>> cancelApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        cardApplicationService.cancelApplication(currentUser.getId(), applicationId);
        return ResponseEntity.ok(Map.of("message", "신청이 취소되었습니다."));
    }
}
