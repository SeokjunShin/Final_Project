package com.mycard.api.service;

import com.mycard.api.dto.auth.LoginRequest;
import com.mycard.api.dto.auth.LoginResponse;
import com.mycard.api.dto.auth.RegisterRequest;
import com.mycard.api.dto.auth.TokenResponse;
import com.mycard.api.entity.AuditLog;
import com.mycard.api.entity.LoginAttempt;
import com.mycard.api.entity.RefreshToken;
import com.mycard.api.entity.Role;
import com.mycard.api.entity.User;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.repository.LoginAttemptRepository;
import com.mycard.api.repository.RefreshTokenRepository;
import com.mycard.api.repository.RoleRepository;
import com.mycard.api.repository.UserRepository;
import com.mycard.api.security.JwtTokenProvider;
import com.mycard.api.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final RoleRepository roleRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Value("${app.security.login-attempt-limit:5}")
    private int loginAttemptLimit;

    @Value("${app.security.login-lockout-duration-minutes:30}")
    private int lockoutDurationMinutes;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail();
        HttpServletRequest httpRequest = getCurrentHttpRequest();
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : null;

        // 계정 잠금 확인
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null && user.getLocked() && user.getLockExpiryTime() != null) {
            if (LocalDateTime.now().isBefore(user.getLockExpiryTime())) {
                logLoginAttempt(email, ipAddress, userAgent, false, "Account locked");
                throw new LockedException("계정이 잠겨있습니다. " +
                        user.getLockExpiryTime() + " 이후에 다시 시도해주세요.");
            } else {
                // 잠금 해제
                user.setLocked(false);
                user.setLockExpiryTime(null);
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            }
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword()));

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            // 로그인 성공 시 실패 횟수 초기화 + 마지막 로그인 일시 갱신
            if (user != null) {
                user.setFailedLoginAttempts(0);
                user.setLastLoginAt(LocalDateTime.now());
                userRepository.save(user);
            }

            // Access/Refresh Token 생성
            String accessToken = tokenProvider.generateAccessToken(userPrincipal);
            String refreshToken = tokenProvider.generateRefreshToken(userPrincipal.getId());

            // Refresh Token 해시화 후 저장
            saveRefreshToken(userPrincipal.getId(), refreshToken, ipAddress, userAgent);

            // 로그인 성공 로깅
            logLoginAttempt(email, ipAddress, userAgent, true, null);
            auditService.log(AuditLog.ActionType.LOGIN, "User", userPrincipal.getId(), "User logged in");

            List<String> roles = userPrincipal.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .toList();

            String primaryRole = roles.isEmpty() ? "USER" : roles.get(0).replace("ROLE_", "");

            LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                    .id(userPrincipal.getId())
                    .name(userPrincipal.getFullName())
                    .email(userPrincipal.getUsername())
                    .role(primaryRole)
                    .build();

            return LoginResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .user(userInfo)
                    .roles(roles)
                    .build();

        } catch (BadCredentialsException e) {
            // 로그인 실패 처리
            handleFailedLogin(email, ipAddress, userAgent);
            throw e;
        }
    }

    /**
     * 비활성(DISA BLED) 계정에 대해 비밀번호를 다시 확인한 뒤
     * 활성화 + 로그인까지 한 번에 처리하는 전용 로그인 API.
     */
    @Transactional
    public LoginResponse loginAndReactivate(LoginRequest request) {
        String email = request.getEmail();
        HttpServletRequest httpRequest = getCurrentHttpRequest();
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : null;

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("아이디 또는 비밀번호가 올바르지 않습니다."));

        // 잠금 계정은 여기서도 동일하게 막기
        if (user.getLocked() && user.getLockExpiryTime() != null) {
            if (LocalDateTime.now().isBefore(user.getLockExpiryTime())) {
                logLoginAttempt(email, ipAddress, userAgent, false, "Account locked (reactivate)");
                throw new LockedException("계정이 잠겨있습니다. " +
                        user.getLockExpiryTime() + " 이후에 다시 시도해주세요.");
            } else {
                user.setLocked(false);
                user.setLockExpiryTime(null);
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            }
        }

        // 비밀번호 직접 검증
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            handleFailedLogin(email, ipAddress, userAgent);
            throw new BadCredentialsException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        // 비활성 -> 활성 전환
        if (!user.getEnabled()) {
            user.enable();
        }
        user.setFailedLoginAttempts(0);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        UserPrincipal userPrincipal = UserPrincipal.create(user);

        // 토큰 발급
        String accessToken = tokenProvider.generateAccessToken(userPrincipal);
        String refreshToken = tokenProvider.generateRefreshToken(userPrincipal.getId());
        saveRefreshToken(userPrincipal.getId(), refreshToken, ipAddress, userAgent);

        // 로그인 성공 로깅
        logLoginAttempt(email, ipAddress, userAgent, true, "Reactivated disabled account");
        auditService.log(AuditLog.ActionType.LOGIN, "User", userPrincipal.getId(), "User reactivated and logged in");

        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        String primaryRole = roles.isEmpty() ? "USER" : roles.get(0).replace("ROLE_", "");

        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .id(userPrincipal.getId())
                .name(userPrincipal.getFullName())
                .email(userPrincipal.getUsername())
                .role(primaryRole)
                .build();

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userInfo)
                .roles(roles)
                .build();
    }

    @Transactional
    public TokenResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BadRequestException("유효하지 않은 refresh token입니다.");
        }

        String tokenHash = hashToken(refreshToken);
        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadRequestException("Refresh token을 찾을 수 없습니다."));

        if (!storedToken.isValid()) {
            throw new BadRequestException("Refresh token이 만료되었거나 취소되었습니다.");
        }

        // 기존 토큰 취소
        storedToken.revoke();
        refreshTokenRepository.save(storedToken);

        // 새 토큰 발급
        Long userId = storedToken.getUser().getId();
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new BadRequestException("사용자를 찾을 수 없습니다."));

        UserPrincipal userPrincipal = UserPrincipal.create(user);
        String newAccessToken = tokenProvider.generateAccessToken(userPrincipal);
        String newRefreshToken = tokenProvider.generateRefreshToken(userId);

        HttpServletRequest httpRequest = getCurrentHttpRequest();
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : null;

        saveRefreshToken(userId, newRefreshToken, ipAddress, userAgent);

        return new TokenResponse(newAccessToken, newRefreshToken);
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            String tokenHash = hashToken(refreshToken);
            refreshTokenRepository.findByTokenHash(tokenHash)
                    .ifPresent(token -> {
                        token.revoke();
                        refreshTokenRepository.save(token);
                        auditService.log(AuditLog.ActionType.LOGOUT, "User", token.getUser().getId(),
                                "User logged out");
                    });
        }
    }

    @Transactional
    public void logoutAll(Long userId) {
        int revokedCount = refreshTokenRepository.revokeAllUserTokens(userId, LocalDateTime.now());
        log.debug("Revoked {} refresh tokens for user {}", revokedCount, userId);
        auditService.log(AuditLog.ActionType.LOGOUT, "User", userId, "All sessions logged out");
    }

    private void handleFailedLogin(String email, String ipAddress, String userAgent) {
        logLoginAttempt(email, ipAddress, userAgent, false, "Invalid credentials");

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= loginAttemptLimit) {
                user.setLocked(true);
                user.setLockExpiryTime(LocalDateTime.now().plusMinutes(lockoutDurationMinutes));
                log.warn("Account locked due to {} failed attempts: {}", attempts, email);
            }

            userRepository.save(user);
        }
    }

    private void saveRefreshToken(Long userId, String refreshToken, String ipAddress, String userAgent) {
        User user = userRepository.getReferenceById(userId);
        String tokenHash = hashToken(refreshToken);
        LocalDateTime expiresAt = LocalDateTime.ofInstant(
                tokenProvider.getExpirationFromRefreshToken(refreshToken).toInstant(),
                ZoneId.systemDefault());

        RefreshToken token = new RefreshToken(user, tokenHash, expiresAt, userAgent, ipAddress);
        refreshTokenRepository.save(token);
    }

    private void logLoginAttempt(String email, String ipAddress, String userAgent,
            boolean success, String failureReason) {
        LoginAttempt attempt = new LoginAttempt(email, ipAddress, userAgent, success, failureReason);
        userRepository.findByEmail(email).ifPresent(attempt::setUser);
        loginAttemptRepository.save(attempt);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private HttpServletRequest getCurrentHttpRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null)
            return "unknown";
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @Transactional
    public void register(RegisterRequest request) {
        // 이메일 중복 확인
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("이미 사용 중인 이메일입니다.");
        }

        // 새 사용자 생성
        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getName());
        user.setSecondaryPassword(passwordEncoder.encode(request.getSecondaryPassword()));
        user.setPhoneNumber(request.getPhone());
        user.setStatus("ACTIVE");

        // USER 역할 부여
        Role userRole = roleRepository.findByName(Role.USER)
                .orElseThrow(() -> new BadRequestException("USER 역할이 존재하지 않습니다."));
        user.getRoles().add(userRole);

        userRepository.save(user);

        log.info("New user registered: {}", request.getEmail());
    }
}
