package com.mycard.api.controller;

import com.mycard.api.dto.auth.AuthUserResponse;
import com.mycard.api.dto.auth.LoginRequest;
import com.mycard.api.dto.auth.LoginResponse;
import com.mycard.api.dto.auth.RefreshTokenRequest;
import com.mycard.api.dto.auth.RegisterRequest;
import com.mycard.api.dto.auth.SendResetCodeRequest;
import com.mycard.api.dto.auth.ConfirmResetPasswordRequest;
import com.mycard.api.dto.auth.TokenResponse;
import com.mycard.api.dto.auth.VerifySecondPasswordRequest;
import com.mycard.api.dto.auth.VerifySecondPasswordResponse;
import com.mycard.api.security.CurrentUser;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.AuthService;
import com.mycard.api.entity.User;
import com.mycard.api.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

@Tag(name = "인증", description = "인증 관련 API")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @Operation(summary = "회원가입")
    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "로그인")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "비활성 계정 로그인 및 활성화")
    @PostMapping("/login/reactivate")
    public ResponseEntity<LoginResponse> loginAndReactivate(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.loginAndReactivate(request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "현재 사용자 정보")
    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> me(@CurrentUser UserPrincipal user) {
        String role = user.getAuthorities().stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .map(r -> r.replace("ROLE_", ""))
                .orElse("USER");

        User userEntity = userRepository.findById(user.getId()).orElse(null);
        boolean hasSecondaryPassword = userEntity != null && userEntity.getSecondaryPassword() != null
                && !userEntity.getSecondaryPassword().isBlank();

        AuthUserResponse response = AuthUserResponse.builder()
                .id(user.getId())
                .name(user.getFullName())
                .email(user.getUsername())
                .role(role)
                .hasSecondaryPassword(hasSecondaryPassword)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "토큰 갱신")
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        TokenResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "2차 비밀번호 검증")
    @PostMapping("/verify-second-password")
    public ResponseEntity<VerifySecondPasswordResponse> verifySecondPassword(
            @CurrentUser UserPrincipal user,
            @Valid @RequestBody VerifySecondPasswordRequest request) {
        VerifySecondPasswordResponse response = authService.verifySecondPassword(user, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "2차 비밀번호 최초 설정")
    @PostMapping("/register-second-password")
    public ResponseEntity<Void> registerSecondPassword(
            @CurrentUser UserPrincipal user,
            @Valid @RequestBody com.mycard.api.dto.auth.RegisterSecondPasswordRequest request) {
        authService.registerSecondPassword(user, request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "2차 비밀번호 재설정용 인증 코드 메일 발송")
    @PostMapping("/second-password/reset/request-code")
    public ResponseEntity<Void> sendResetCode(
            @CurrentUser UserPrincipal user,
            @Valid @RequestBody SendResetCodeRequest request) {
        authService.sendResetCode(user, request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "2차 비밀번호 재설정 확정")
    @PostMapping("/second-password/reset/confirm")
    public ResponseEntity<Void> resetSecondPassword(
            @CurrentUser UserPrincipal user,
            @Valid @RequestBody ConfirmResetPasswordRequest request) {
        authService.resetSecondPassword(user, request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "로그아웃")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) RefreshTokenRequest request) {
        if (request != null) {
            authService.logout(request.getRefreshToken());
        }
        return ResponseEntity.ok().build();
    }
}