package com.mycard.api.controller;

import com.mycard.api.dto.admin.AdminPasswordChangeRequest;
import com.mycard.api.security.CurrentUser;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.AdminSecurityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "ADMIN_ACCOUNT", description = "관리자 계정 보안 API")
@RestController
@RequestMapping("/admin/account")
@PreAuthorize("hasAnyRole('MASTER_ADMIN', 'REVIEW_ADMIN', 'OPERATOR')")
@RequiredArgsConstructor
public class AdminAccountController {

    private final AdminSecurityService adminSecurityService;

    @Operation(summary = "관리자 비밀번호 변경", description = "로그인된 관리자가 현재 비밀번호와 PEM 키 검증 후 비밀번호를 변경합니다.")
    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(
            @CurrentUser UserPrincipal principal,
            @Valid @RequestBody AdminPasswordChangeRequest request) {
        adminSecurityService.changeAdminPassword(principal, request);
        return ResponseEntity.ok().build();
    }
}
