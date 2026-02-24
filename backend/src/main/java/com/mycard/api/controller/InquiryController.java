package com.mycard.api.controller;

import com.mycard.api.dto.inquiry.*;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.InquiryService;
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

@Tag(name = "고객문의", description = "1:1 문의 API")
@RestController
@RequestMapping("/inquiries")
@PreAuthorize("hasAnyRole('USER','OPERATOR','ADMIN')")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    @Operation(summary = "내 문의 목록 조회")
    @GetMapping
    public ResponseEntity<Page<InquiryListResponse>> getMyInquiries(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<InquiryListResponse> response = inquiryService.getMyInquiries(currentUser, pageable);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "문의 상세 조회")
    @GetMapping("/{inquiryId}")
    public ResponseEntity<InquiryDetailResponse> getInquiry(
            @PathVariable Long inquiryId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        InquiryDetailResponse response = inquiryService.getInquiry(inquiryId, currentUser);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "문의 등록")
    @PostMapping
    public ResponseEntity<InquiryDetailResponse> createInquiry(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody InquiryCreateRequest request) {
        InquiryDetailResponse response = inquiryService.createInquiry(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "문의 답변 추가")
    @PostMapping("/{inquiryId}/replies")
    public ResponseEntity<InquiryDetailResponse> addReply(
            @PathVariable Long inquiryId,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody InquiryReplyRequest request) {
        InquiryDetailResponse response = inquiryService.addReply(inquiryId, currentUser, request);
        return ResponseEntity.ok(response);
    }
}
