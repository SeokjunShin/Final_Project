package com.mycard.api.service;

import com.mycard.api.dto.auth.CancelWithdrawalRequest;
import com.mycard.api.dto.auth.ConfirmPasswordResetRequest;
import com.mycard.api.dto.auth.ConfirmResetPasswordRequest;
import com.mycard.api.dto.auth.LoginRequest;
import com.mycard.api.dto.auth.LoginResponse;
import com.mycard.api.dto.auth.PasswordResetRequestResponse;
import com.mycard.api.dto.auth.PasswordResetVerifyResponse;
import com.mycard.api.dto.auth.RegisterRequest;
import com.mycard.api.dto.auth.RegisterResponse;
import com.mycard.api.dto.auth.RegisterSecondPasswordRequest;
import com.mycard.api.dto.auth.RequestPasswordResetRequest;
import com.mycard.api.dto.auth.SendResetCodeRequest;
import com.mycard.api.dto.auth.TokenResponse;
import com.mycard.api.dto.auth.VerifyPasswordRecoveryRequest;
import com.mycard.api.dto.auth.VerifySecondPasswordRequest;
import com.mycard.api.dto.auth.VerifySecondPasswordResponse;
import com.mycard.api.entity.AuditLog;
import com.mycard.api.entity.RefreshToken;
import com.mycard.api.entity.Role;
import com.mycard.api.entity.User;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.exception.InvalidLoginCredentialsException;
import com.mycard.api.exception.LoginBlockedException;
import com.mycard.api.exception.UnauthorizedException;
import com.mycard.api.repository.RefreshTokenRepository;
import com.mycard.api.repository.RoleRepository;
import com.mycard.api.repository.UserRepository;
import com.mycard.api.security.JwtTokenProvider;
import com.mycard.api.security.SessionFingerprintUtils;
import com.mycard.api.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
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
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RoleRepository roleRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final EmailService emailService;
    private final LoginSecurityService loginSecurityService;
    private final TotpService totpService;

    @Value("${app.security.login-lockout-duration-minutes:30}")
    private int lockoutDurationMinutes;

    @Value("${app.security.ip-attempt-limit:20}")
    private int ipAttemptLimit;

    @Value("${app.jwt.absolute-session-validity-ms:2592000000}")
    private long absoluteSessionValidityMs;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        return secureLogin(request);
    }

    @Transactional
    public LoginResponse secureLogin(LoginRequest request) {
        String email = request.getEmail();
        HttpServletRequest httpRequest = getCurrentHttpRequest();
        String ipAddress = SessionFingerprintUtils.extractClientIp(httpRequest);
        String userAgent = SessionFingerprintUtils.extractUserAgent(httpRequest);

        enforceIpRateLimit(email, ipAddress, userAgent, "IP rate limit exceeded");

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            clearLegacyLoginLock(user);
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword()));

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            if (user != null) {
                user.setLastFailedLoginAt(null);
                user.setLastLoginAt(LocalDateTime.now());
                userRepository.save(user);
            }

            SessionTokens sessionTokens = issueSessionTokens(userPrincipal, ipAddress, userAgent, false);

            loginSecurityService.recordSuccessfulLogin(userPrincipal.getId(), email, ipAddress, userAgent, null);
            auditService.log(AuditLog.ActionType.LOGIN, "User", userPrincipal.getId(), "User logged in");

            return buildLoginResponse(user, userPrincipal, sessionTokens.accessToken(), sessionTokens.refreshToken());

        } catch (BadCredentialsException | LockedException | DisabledException e) {
            throw handleFailedLogin(email, ipAddress, userAgent);
        }
    }

    @Transactional
    public LoginResponse loginAndReactivate(LoginRequest request) {
        String email = request.getEmail();
        HttpServletRequest httpRequest = getCurrentHttpRequest();
        String ipAddress = SessionFingerprintUtils.extractClientIp(httpRequest);
        String userAgent = SessionFingerprintUtils.extractUserAgent(httpRequest);
        enforceIpRateLimit(email, ipAddress, userAgent, "IP rate limit exceeded (reactivate)");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("아이디 또는 비밀번호가 올바르지 않습니다."));

        clearLegacyLoginLock(user);

        if (user.isWithdrawalPending()) {
            throw new DisabledException("회원 탈퇴가 예약되었습니다. 15분 후 최종 탈퇴 처리됩니다.");
        }
        if (user.isWithdrawn()) {
            throw new DisabledException("이미 탈퇴 처리된 계정입니다.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw handleFailedLogin(email, ipAddress, userAgent);
        }

        if (!user.getEnabled()) {
            user.enable();
        }
        user.setLastFailedLoginAt(null);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        UserPrincipal userPrincipal = UserPrincipal.create(user);
        SessionTokens sessionTokens = issueSessionTokens(userPrincipal, ipAddress, userAgent, false);

        loginSecurityService.recordSuccessfulLogin(
                userPrincipal.getId(),
                email,
                ipAddress,
                userAgent,
                "Reactivated disabled account");
        auditService.log(AuditLog.ActionType.LOGIN, "User", userPrincipal.getId(), "User reactivated and logged in");

        return buildLoginResponse(user, userPrincipal, sessionTokens.accessToken(), sessionTokens.refreshToken());
    }

    @Transactional
    public LoginResponse cancelWithdrawalAndLogin(CancelWithdrawalRequest request) {
        String email = request.getEmail();
        HttpServletRequest httpRequest = getCurrentHttpRequest();
        String ipAddress = SessionFingerprintUtils.extractClientIp(httpRequest);
        String userAgent = SessionFingerprintUtils.extractUserAgent(httpRequest);
        enforceIpRateLimit(email, ipAddress, userAgent, "IP rate limit exceeded (cancel withdrawal)");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!user.isWithdrawalPending()) {
            throw new BadRequestException("탈퇴 예약 상태의 계정이 아닙니다.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw handleFailedLogin(email, ipAddress, userAgent);
        }

        if (user.getSecondaryPassword() == null
                || !passwordEncoder.matches(request.getSecondaryPassword(), user.getSecondaryPassword())) {
            throw new BadRequestException("2차 비밀번호가 올바르지 않습니다.");
        }

        user.cancelWithdrawalRequest();
        user.setLastFailedLoginAt(null);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        UserPrincipal userPrincipal = UserPrincipal.create(user);
        SessionTokens sessionTokens = issueSessionTokens(userPrincipal, ipAddress, userAgent, true);

        loginSecurityService.recordSuccessfulLogin(
                userPrincipal.getId(),
                email,
                ipAddress,
                userAgent,
                "Canceled withdrawal reservation and logged in");
        auditService.log(AuditLog.ActionType.UPDATE, "USER_ACCOUNT", userPrincipal.getId(), "회원 탈퇴 예약 취소");

        return buildLoginResponse(user, userPrincipal, sessionTokens.accessToken(), sessionTokens.refreshToken());
    }

    @Transactional
    public TokenResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("INVALID_REFRESH_TOKEN", "유효하지 않은 refresh token입니다.");
        }
        if (!tokenProvider.isRefreshToken(refreshToken)) {
            throw new UnauthorizedException("INVALID_TOKEN_TYPE", "refresh token 형식이 아닙니다.");
        }

        String tokenHash = hashToken(refreshToken);
        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("REFRESH_TOKEN_NOT_FOUND", "Refresh token을 찾을 수 없습니다."));

        if (storedToken.isRevoked()) {
            handleRefreshTokenCompromise(storedToken, "Revoked refresh token reuse detected");
            throw new UnauthorizedException("REFRESH_TOKEN_REUSED", "재사용된 refresh token이 감지되었습니다.");
        }

        if (storedToken.isExpired() || storedToken.isAbsoluteExpired()) {
            revokeSessionTokens(storedToken.getUser().getId(), storedToken.getSessionId());
            throw new UnauthorizedException("SESSION_EXPIRED", "세션이 만료되었습니다.");
        }

        HttpServletRequest httpRequest = getCurrentHttpRequest();
        String ipAddress = SessionFingerprintUtils.extractClientIp(httpRequest);
        String userAgent = SessionFingerprintUtils.extractUserAgent(httpRequest);
        if (isSuspiciousSessionFingerprint(storedToken, ipAddress, userAgent)) {
            handleRefreshTokenCompromise(storedToken, "Refresh token fingerprint mismatch detected");
            throw new UnauthorizedException("SUSPICIOUS_REFRESH_ACTIVITY", "비정상적인 세션 갱신이 감지되었습니다.");
        }

        storedToken.revoke();
        refreshTokenRepository.save(storedToken);

        Long userId = storedToken.getUser().getId();
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new BadRequestException("사용자를 찾을 수 없습니다."));

        UserPrincipal userPrincipal = UserPrincipal.create(
                user,
                storedToken.getSessionId(),
                storedToken.isSecondAuthVerified());
        String newAccessToken = tokenProvider.generateAccessToken(
                userPrincipal,
                storedToken.getSessionId(),
                storedToken.isSecondAuthVerified());
        String newRefreshToken = tokenProvider.generateRefreshToken(userId, storedToken.getSessionId());

        saveRefreshToken(
                userId,
                newRefreshToken,
                ipAddress,
                userAgent,
                storedToken.getSessionId(),
                storedToken.isSecondAuthVerified(),
                storedToken.getSessionStartedAt(),
                storedToken.getAbsoluteExpiresAt());

        return new TokenResponse(newAccessToken, newRefreshToken);
    }

    @Transactional
    public void logout(String accessToken, String refreshToken) {
        boolean revoked = false;

        if (refreshToken != null && !refreshToken.isBlank()
                && tokenProvider.validateToken(refreshToken)
                && tokenProvider.isRefreshToken(refreshToken)) {
            String tokenHash = hashToken(refreshToken);
            RefreshToken token = refreshTokenRepository.findByTokenHash(tokenHash).orElse(null);
            if (token != null) {
                revokeSessionTokens(token.getUser().getId(), token.getSessionId());
                auditService.log(AuditLog.ActionType.LOGOUT, "User", token.getUser().getId(), "User logged out");
                revoked = true;
            }
        }

        if (!revoked && accessToken != null && !accessToken.isBlank()
                && tokenProvider.validateToken(accessToken)
                && tokenProvider.isAccessToken(accessToken)) {
            Long userId = tokenProvider.getUserIdFromToken(accessToken);
            String sessionId = tokenProvider.getSessionIdFromToken(accessToken);
            if (sessionId != null && !sessionId.isBlank()) {
                revokeSessionTokens(userId, sessionId);
                auditService.log(AuditLog.ActionType.LOGOUT, "User", userId, "User logged out");
            }
        }
    }

    @Transactional
    public void logoutAll(Long userId) {
        int revokedCount = refreshTokenRepository.revokeAllUserTokens(userId, LocalDateTime.now());
        log.debug("Revoked {} refresh tokens for user {}", revokedCount, userId);
        auditService.log(AuditLog.ActionType.LOGOUT, "User", userId, "All sessions logged out");
    }

    private RuntimeException handleFailedLogin(String email, String ipAddress, String userAgent) {
        LoginSecurityService.FailedLoginResult result = loginSecurityService.recordFailedLogin(
                email,
                ipAddress,
                userAgent,
                ipAttemptLimit,
                lockoutDurationMinutes);

        if (result.blocked() && result.lockExpiryTime() != null) {
            return buildLoginBlockedException(
                    "TOO_MANY_LOGIN_ATTEMPTS",
                    "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.",
                    Math.max(1, java.time.Duration.between(LocalDateTime.now(), result.lockExpiryTime()).getSeconds()));
        }

        return new InvalidLoginCredentialsException(
                "아이디 또는 비밀번호가 일치하지 않습니다.",
                result.remainingAttempts());
    }

    private void enforceIpRateLimit(String email, String ipAddress, String userAgent, String reason) {
        if (!loginSecurityService.hasTooManyRecentFailuresForIp(ipAddress, ipAttemptLimit, lockoutDurationMinutes)) {
            return;
        }
        loginSecurityService.recordLockedLoginAttempt(email, ipAddress, userAgent, reason);
        long retryAfterSeconds = loginSecurityService.getRetryAfterSecondsForIp(
                ipAddress,
                ipAttemptLimit,
                lockoutDurationMinutes);
        throw buildLoginBlockedException(
                "TOO_MANY_LOGIN_ATTEMPTS",
                "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.",
                retryAfterSeconds);
    }

    private void saveRefreshToken(Long userId, String refreshToken, String ipAddress, String userAgent,
                                  String sessionId, boolean secondAuthVerified,
                                  LocalDateTime sessionStartedAt, LocalDateTime absoluteExpiresAt) {
        User user = userRepository.getReferenceById(userId);
        String tokenHash = hashToken(refreshToken);
        LocalDateTime expiresAt = LocalDateTime.ofInstant(
                tokenProvider.getExpirationFromRefreshToken(refreshToken).toInstant(),
                ZoneId.systemDefault());

        RefreshToken token = new RefreshToken(
                user,
                sessionId,
                tokenHash,
                secondAuthVerified,
                expiresAt,
                sessionStartedAt,
                absoluteExpiresAt,
                userAgent,
                ipAddress);
        refreshTokenRepository.save(token);
    }

    private SessionTokens issueSessionTokens(UserPrincipal userPrincipal, String ipAddress, String userAgent,
                                             boolean secondAuthVerified) {
        LocalDateTime sessionStartedAt = LocalDateTime.now();
        LocalDateTime absoluteExpiresAt = sessionStartedAt.plusNanos(absoluteSessionValidityMs * 1_000_000L);
        String sessionId = UUID.randomUUID().toString();
        String accessToken = tokenProvider.generateAccessToken(userPrincipal, sessionId, secondAuthVerified);
        String refreshToken = tokenProvider.generateRefreshToken(userPrincipal.getId(), sessionId);
        saveRefreshToken(
                userPrincipal.getId(),
                refreshToken,
                ipAddress,
                userAgent,
                sessionId,
                secondAuthVerified,
                sessionStartedAt,
                absoluteExpiresAt);
        return new SessionTokens(accessToken, refreshToken);
    }

    private LoginResponse buildLoginResponse(User user, UserPrincipal userPrincipal,
                                             String accessToken, String refreshToken) {
        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        String primaryRole = roles.stream()
                .map(r -> r.replace("ROLE_", ""))
                .filter(r -> !r.equals("USER"))
                .findFirst()
                .orElse("USER");

        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .id(userPrincipal.getId())
                .name(userPrincipal.getFullName())
                .email(userPrincipal.getUsername())
                .role(primaryRole)
                .hasSecondaryPassword(user != null && user.getSecondaryPassword() != null
                        && !user.getSecondaryPassword().isBlank())
                .build();

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userInfo)
                .roles(roles)
                .build();
    }

    private String markSecondAuthVerified(UserPrincipal userPrincipal) {
        String sessionId = userPrincipal.getSessionId();
        if (sessionId == null || sessionId.isBlank()) {
            throw new BadRequestException("인증 세션이 유효하지 않습니다.");
        }

        List<RefreshToken> sessionTokens = refreshTokenRepository.findActiveTokensByUserIdAndSessionId(
                userPrincipal.getId(),
                sessionId,
                LocalDateTime.now());

        if (sessionTokens.isEmpty()) {
            throw new BadRequestException("인증 세션을 찾을 수 없습니다.");
        }

        sessionTokens.forEach(token -> token.setSecondAuthVerified(true));
        refreshTokenRepository.saveAll(sessionTokens);

        User verifiedUser = userRepository.findByIdWithRoles(userPrincipal.getId())
                .orElseThrow(() -> new BadRequestException("사용자를 찾을 수 없습니다."));
        UserPrincipal verifiedPrincipal = UserPrincipal.create(verifiedUser, sessionId, true);

        return tokenProvider.generateAccessToken(verifiedPrincipal, sessionId, true);
    }

    private void revokeSessionTokens(Long userId, String sessionId) {
        refreshTokenRepository.revokeSessionTokens(userId, sessionId, LocalDateTime.now());
    }

    private void handleRefreshTokenCompromise(RefreshToken storedToken, String detail) {
        revokeSessionTokens(storedToken.getUser().getId(), storedToken.getSessionId());
        auditService.log(
                AuditLog.ActionType.SECURITY_ALERT,
                "AUTH_SESSION",
                storedToken.getUser().getId(),
                detail);
    }

    private boolean isSuspiciousSessionFingerprint(RefreshToken storedToken, String ipAddress, String userAgent) {
        return !SessionFingerprintUtils.matches(storedToken, ipAddress, userAgent);
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

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("이미 사용 중인 이메일입니다.");
        }

        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getName());
        user.setSecondaryPassword(passwordEncoder.encode(request.getSecondaryPassword()));
        user.setPhoneNumber(request.getPhone());
        user.setStatus("ACTIVE");
        String otpSecret = totpService.generateSecret();
        user.setOtpSecret(otpSecret);
        user.setOtpEnabled(true);

        Role userRole = roleRepository.findByName(Role.USER)
                .orElseThrow(() -> new BadRequestException("USER 역할이 존재하지 않습니다."));
        user.getRoles().add(userRole);

        userRepository.save(user);

        log.info("New user registered: {}", request.getEmail());
        return RegisterResponse.builder()
                .otpSecret(otpSecret)
                .otpAuthUri(totpService.buildOtpAuthUri("MyCard", request.getEmail(), otpSecret))
                .message("회원가입이 완료되었습니다. Google Authenticator에 OTP를 등록해주세요.")
                .build();
    }

    @Transactional
    public VerifySecondPasswordResponse verifySecondPassword(UserPrincipal user, VerifySecondPasswordRequest request) {
        User targetUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new BadRequestException("사용자를 찾을 수 없습니다."));

        if (targetUser.getSecondaryPassword() == null || targetUser.getSecondaryPassword().isBlank()) {
            throw new BadRequestException("2차 비밀번호가 설정되어 있지 않습니다.");
        }

        if (!passwordEncoder.matches(request.getSecondaryPassword(), targetUser.getSecondaryPassword())) {
            throw new BadRequestException("비밀번호가 일치하지 않습니다.");
        }

        String accessToken = markSecondAuthVerified(user);

        return VerifySecondPasswordResponse.builder()
                .success(true)
                .message("인증에 성공했습니다.")
                .accessToken(accessToken)
                .build();
    }

    @Transactional
    public VerifySecondPasswordResponse registerSecondPassword(UserPrincipal user, RegisterSecondPasswordRequest request) {
        User targetUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new BadRequestException("사용자를 찾을 수 없습니다."));

        if (targetUser.getSecondaryPassword() != null && !targetUser.getSecondaryPassword().isBlank()) {
            throw new BadRequestException("이미 2차 비밀번호가 설정되어 있습니다. 변경은 보안 설정에서 진행해주세요.");
        }

        targetUser.setSecondaryPassword(passwordEncoder.encode(request.getSecondaryPassword()));
        userRepository.save(targetUser);

        auditService.log(AuditLog.ActionType.UPDATE, "User", targetUser.getId(),
                "User registered initial secondary password");

        String accessToken = markSecondAuthVerified(user);

        return VerifySecondPasswordResponse.builder()
                .success(true)
                .message("2차 비밀번호가 설정되었습니다.")
                .accessToken(accessToken)
                .build();
    }

    @Transactional
    public void sendResetCode(UserPrincipal user, SendResetCodeRequest request) {
        emailService.sendResetCode(request.getEmail());
    }

    @Transactional
    public void resetSecondPassword(UserPrincipal user, ConfirmResetPasswordRequest request) {
        User targetUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new BadRequestException("사용자를 찾을 수 없습니다."));

        boolean isValid = emailService.verifyCode(request.getEmail(), request.getCode());
        if (!isValid) {
            throw new BadRequestException("인증 코드가 올바르지 않거나 만료되었습니다.");
        }

        targetUser.setSecondaryPassword(passwordEncoder.encode(request.getNewSecondPassword()));
        userRepository.save(targetUser);

        auditService.log(AuditLog.ActionType.UPDATE, "User", targetUser.getId(),
                "User resetted secondary password via email verification");
    }

    @Transactional(readOnly = true)
    public PasswordResetRequestResponse requestPasswordReset(RequestPasswordResetRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("해당 이메일로 가입된 사용자를 찾을 수 없습니다."));
        if (!Boolean.TRUE.equals(user.getOtpEnabled()) || user.getOtpSecret() == null || user.getOtpSecret().isBlank()) {
            throw new BadRequestException("구글 OTP가 등록되지 않은 계정입니다. 관리자에게 문의해주세요.");
        }
        return new PasswordResetRequestResponse("Google OTP 6자리 코드를 입력해 주세요.");
    }

    @Transactional
    public void confirmPasswordReset(ConfirmPasswordResetRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("해당 이메일로 가입된 사용자를 찾을 수 없습니다."));

        if (!tokenProvider.validateToken(request.getResetToken())
                || !tokenProvider.isPasswordResetToken(request.getResetToken())) {
            throw new BadRequestException("비밀번호 재설정 토큰이 유효하지 않습니다.");
        }
        if (!tokenProvider.getUserIdFromToken(request.getResetToken()).equals(user.getId())) {
            throw new BadRequestException("비밀번호 재설정 토큰이 사용자와 일치하지 않습니다.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        logoutAll(user.getId());

        auditService.log(AuditLog.ActionType.UPDATE, "User", user.getId(),
                "User reset login password via Google OTP");
    }

    @Transactional
    public PasswordResetVerifyResponse verifyPasswordRecovery(VerifyPasswordRecoveryRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("해당 이메일로 가입된 사용자를 찾을 수 없습니다."));

        if (!Boolean.TRUE.equals(user.getOtpEnabled()) || user.getOtpSecret() == null || user.getOtpSecret().isBlank()) {
            throw new BadRequestException("구글 OTP가 등록되지 않은 계정입니다.");
        }
        if (!totpService.verifyCode(user.getOtpSecret(), request.getOtpCode())) {
            throw new BadRequestException("OTP 코드가 올바르지 않습니다.");
        }

        return PasswordResetVerifyResponse.builder()
                .success(true)
                .message("OTP 인증이 완료되었습니다.")
                .resetToken(tokenProvider.generatePasswordResetToken(user.getId()))
                .build();
    }

    private record SessionTokens(String accessToken, String refreshToken) {
    }

    private void clearLegacyLoginLock(User user) {
        if (!Boolean.TRUE.equals(user.getLocked()) || user.getLockExpiryTime() == null) {
            return;
        }
        user.setLocked(false);
        user.setFailedLoginAttempts(0);
        user.setLockExpiryTime(null);
        user.setLastFailedLoginAt(null);
        userRepository.save(user);
    }

    private LoginBlockedException buildLoginBlockedException(String code, String message, long retryAfterSeconds) {
        LocalDateTime lockExpiresAt = LocalDateTime.now().plusSeconds(Math.max(1, retryAfterSeconds));
        return new LoginBlockedException(code, message, lockExpiresAt, Math.max(1, retryAfterSeconds));
    }
}
