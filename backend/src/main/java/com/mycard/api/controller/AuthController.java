package com.mycard.api.controller;

import com.mycard.api.dto.auth.AuthUserResponse;
import com.mycard.api.dto.auth.LoginRequest;
import com.mycard.api.dto.auth.LoginResponse;
import com.mycard.api.dto.auth.RefreshTokenRequest;
import com.mycard.api.dto.auth.RegisterRequest;
import com.mycard.api.dto.auth.TokenResponse;
import com.mycard.api.security.CurrentUser;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.AuthService;
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

    @Operation(summary = "현재 사용자 정보")
    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> me(@CurrentUser UserPrincipal user) {
        String role = user.getAuthorities().stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .map(r -> r.replace("ROLE_", ""))
                .orElse("USER");

        AuthUserResponse response = AuthUserResponse.builder()
                .id(user.getId())
                .name(user.getFullName())
                .email(user.getUsername())
                .role(role)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "토큰 갱신")
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        TokenResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(response);
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
