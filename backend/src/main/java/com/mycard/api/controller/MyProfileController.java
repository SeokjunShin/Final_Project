package com.mycard.api.controller;

import com.mycard.api.dto.user.ChangePasswordRequest;
import com.mycard.api.dto.user.SecuritySettingsRequest;
import com.mycard.api.dto.user.UpdateProfileRequest;
import com.mycard.api.dto.user.UserProfileResponse;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.UserSecurityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "My Profile", description = "내 정보/보안 설정 API")
@RestController
@RequestMapping("/me")
@PreAuthorize("hasRole('USER')")
@RequiredArgsConstructor
public class MyProfileController {

    private final UserSecurityService userSecurityService;

    @Operation(summary = "내 정보 조회")
    @GetMapping
    public ResponseEntity<UserProfileResponse> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userSecurityService.getMyProfile(principal));
    }

    @Operation(summary = "내 정보 수정", description = "민감 변경 재인증(current_password) 필요")
    @PatchMapping
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(userSecurityService.updateMyProfile(principal, request));
    }

    @Operation(summary = "비밀번호 변경", description = "재인증(current_password) 필요")
    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userSecurityService.changePassword(principal, request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "보안설정 변경", description = "2FA on/off (흐름 구현)")
    @PostMapping("/security")
    public ResponseEntity<UserProfileResponse> updateSecurity(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SecuritySettingsRequest request
    ) {
        return ResponseEntity.ok(userSecurityService.updateSecuritySettings(principal, request));
    }
}
