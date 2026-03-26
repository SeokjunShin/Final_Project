package com.mycard.api.service;

import com.mycard.api.entity.LoginAttempt;
import com.mycard.api.entity.User;
import com.mycard.api.repository.LoginAttemptRepository;
import com.mycard.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoginSecurityService {

    public record FailedLoginResult(int remainingAttempts, boolean blocked, LocalDateTime lockExpiryTime) {
    }

    private final UserRepository userRepository;
    private final LoginAttemptRepository loginAttemptRepository;

    @Transactional(readOnly = true)
    public boolean hasTooManyRecentFailuresForEmail(String email, int loginAttemptLimit, int lockoutDurationMinutes) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(lockoutDurationMinutes);
        return loginAttemptRepository.countFailedAttemptsSince(email, since) >= loginAttemptLimit;
    }

    @Transactional(readOnly = true)
    public boolean hasTooManyRecentFailuresForIp(String ipAddress, int ipAttemptLimit, int lockoutDurationMinutes) {
        if (ipAddress == null || ipAddress.isBlank() || "unknown".equalsIgnoreCase(ipAddress)) {
            return false;
        }
        LocalDateTime since = LocalDateTime.now().minusMinutes(lockoutDurationMinutes);
        return loginAttemptRepository.countFailedAttemptsByIpSince(ipAddress, since) >= ipAttemptLimit;
    }

    @Transactional(readOnly = true)
    public long getRetryAfterSecondsForEmail(String email, int loginAttemptLimit, int lockoutDurationMinutes) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime since = now.minusMinutes(lockoutDurationMinutes);
        long count = loginAttemptRepository.countFailedAttemptsSince(email, since);
        if (count < loginAttemptLimit) {
            return 0;
        }
        LocalDateTime earliest = loginAttemptRepository.findEarliestFailedAttemptSince(email, since);
        if (earliest == null) {
            return 0;
        }
        return Math.max(1, Duration.between(now, earliest.plusMinutes(lockoutDurationMinutes)).getSeconds());
    }

    @Transactional(readOnly = true)
    public long getRetryAfterSecondsForIp(String ipAddress, int ipAttemptLimit, int lockoutDurationMinutes) {
        if (ipAddress == null || ipAddress.isBlank() || "unknown".equalsIgnoreCase(ipAddress)) {
            return 0;
        }
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime since = now.minusMinutes(lockoutDurationMinutes);
        long count = loginAttemptRepository.countFailedAttemptsByIpSince(ipAddress, since);
        if (count < ipAttemptLimit) {
            return 0;
        }
        LocalDateTime earliest = loginAttemptRepository.findEarliestFailedAttemptByIpSince(ipAddress, since);
        if (earliest == null) {
            return 0;
        }
        return Math.max(1, Duration.between(now, earliest.plusMinutes(lockoutDurationMinutes)).getSeconds());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public FailedLoginResult recordFailedLogin(String email, String ipAddress, String userAgent,
                                               int loginAttemptLimit, int lockoutDurationMinutes) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime since = now.minusMinutes(lockoutDurationMinutes);
        LoginAttempt attempt = new LoginAttempt(email, ipAddress, userAgent, false, "Invalid credentials");
        User user = userRepository.findByEmail(email).orElse(null);
        long currentIpAttempts = (ipAddress == null || ipAddress.isBlank() || "unknown".equalsIgnoreCase(ipAddress))
                ? 0
                : loginAttemptRepository.countFailedAttemptsByIpSince(ipAddress, since) + 1;
        long currentEmailAttempts = loginAttemptRepository.countFailedAttemptsSince(email, since) + 1;
        int remainingAttempts = Math.max(0, loginAttemptLimit - (int) currentIpAttempts);
        boolean blocked = currentIpAttempts >= loginAttemptLimit;
        LocalDateTime lockExpiryTime = null;
        if (user != null) {
            attempt.setUser(user);
            int attempts = (user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0) + 1;
            user.setFailedLoginAttempts(attempts);
            user.setLastFailedLoginAt(now);
            remainingAttempts = Math.min(
                    Math.max(0, loginAttemptLimit - attempts),
                    Math.max(0, loginAttemptLimit - (int) currentIpAttempts));

            if (attempts >= loginAttemptLimit) {
                user.lock();
                lockExpiryTime = now.plusMinutes(lockoutDurationMinutes);
                user.setLockExpiryTime(lockExpiryTime);
                blocked = true;
                log.warn("Account locked due to {} failed attempts: {}", attempts, email);
            }

            userRepository.save(user);
        } else {
            remainingAttempts = Math.min(
                    Math.max(0, loginAttemptLimit - (int) currentEmailAttempts),
                    Math.max(0, loginAttemptLimit - (int) currentIpAttempts));
        }
        loginAttemptRepository.save(attempt);

        if (lockExpiryTime == null && blocked) {
            LocalDateTime earliestIpAttempt = loginAttemptRepository.findEarliestFailedAttemptByIpSince(ipAddress, since);
            if (earliestIpAttempt != null) {
                lockExpiryTime = earliestIpAttempt.plusMinutes(lockoutDurationMinutes);
            } else {
                lockExpiryTime = now.plusMinutes(lockoutDurationMinutes);
            }
        }

        return new FailedLoginResult(remainingAttempts, blocked, lockExpiryTime);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSuccessfulLogin(Long userId, String email, String ipAddress, String userAgent, String reason) {
        LoginAttempt attempt = new LoginAttempt(email, ipAddress, userAgent, true, reason);
        userRepository.findById(userId).ifPresent(attempt::setUser);
        loginAttemptRepository.save(attempt);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLockedLoginAttempt(String email, String ipAddress, String userAgent, String reason) {
        LoginAttempt attempt = new LoginAttempt(email, ipAddress, userAgent, false, reason);
        userRepository.findByEmail(email).ifPresent(attempt::setUser);
        loginAttemptRepository.save(attempt);
    }
}
