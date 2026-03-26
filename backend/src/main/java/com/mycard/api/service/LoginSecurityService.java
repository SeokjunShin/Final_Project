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

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoginSecurityService {

    private final UserRepository userRepository;
    private final LoginAttemptRepository loginAttemptRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailedLogin(String email, String ipAddress, String userAgent,
                                  int loginAttemptLimit, int lockoutDurationMinutes) {
        LoginAttempt attempt = new LoginAttempt(email, ipAddress, userAgent, false, "Invalid credentials");
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            attempt.setUser(user);
            int attempts = (user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0) + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= loginAttemptLimit) {
                user.lock();
                user.setLockExpiryTime(LocalDateTime.now().plusMinutes(lockoutDurationMinutes));
                log.warn("Account locked due to {} failed attempts: {}", attempts, email);
            }

            userRepository.save(user);
        }
        loginAttemptRepository.save(attempt);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSuccessfulLogin(Long userId, String email, String ipAddress, String userAgent, String reason) {
        LoginAttempt attempt = new LoginAttempt(email, ipAddress, userAgent, true, reason);
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            attempt.setUser(user);
            user.setFailedLoginAttempts(0);
            user.setLockExpiryTime(null);
            user.setLastLoginAt(LocalDateTime.now());
            if (Boolean.TRUE.equals(user.getLocked())) {
                user.unlock();
            }
            userRepository.save(user);
        }
        loginAttemptRepository.save(attempt);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLockedLoginAttempt(String email, String ipAddress, String userAgent, String reason) {
        LoginAttempt attempt = new LoginAttempt(email, ipAddress, userAgent, false, reason);
        userRepository.findByEmail(email).ifPresent(attempt::setUser);
        loginAttemptRepository.save(attempt);
    }
}
