package com.mycard.api.service;

import com.mycard.api.entity.User;
import com.mycard.api.repository.LoginAttemptRepository;
import com.mycard.api.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginSecurityServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private LoginAttemptRepository loginAttemptRepository;

    @InjectMocks
    private LoginSecurityService loginSecurityService;

    @Test
    void recordFailedLoginIncrementsAttemptsAndLocksUserAtThreshold() {
        User user = new User("user@example.com", "encoded", "홍길동");
        user.setFailedLoginAttempts(4);
        user.setStatus("ACTIVE");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        loginSecurityService.recordFailedLogin("user@example.com", "127.0.0.1", "JUnit", 5, 30);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());

        User savedUser = captor.getValue();
        assertThat(savedUser.getFailedLoginAttempts()).isEqualTo(5);
        assertThat(savedUser.getLocked()).isTrue();
        assertThat(savedUser.getLockExpiryTime()).isAfter(LocalDateTime.now().plusMinutes(29));
        verify(loginAttemptRepository).save(any());
    }

    @Test
    void recordSuccessfulLoginResetsFailureState() {
        User user = new User("user@example.com", "encoded", "홍길동");
        user.setId(1L);
        user.setFailedLoginAttempts(3);
        user.setStatus("LOCKED");
        user.setLockExpiryTime(LocalDateTime.now().plusMinutes(10));

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        loginSecurityService.recordSuccessfulLogin(1L, "user@example.com", "127.0.0.1", "JUnit", null);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());

        User savedUser = captor.getValue();
        assertThat(savedUser.getFailedLoginAttempts()).isZero();
        assertThat(savedUser.getLockExpiryTime()).isNull();
        assertThat(savedUser.getLocked()).isFalse();
        assertThat(savedUser.getLastLoginAt()).isNotNull();
        verify(loginAttemptRepository).save(any());
    }
}
