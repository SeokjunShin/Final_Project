package com.mycard.api.service;

import com.mycard.api.dto.UserAdminResponse;
import com.mycard.api.dto.UserStatusUpdateRequest;
import com.mycard.api.entity.Role;
import com.mycard.api.entity.User;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.RefreshTokenRepository;
import com.mycard.api.repository.UserRepository;
import com.mycard.api.util.MaskingUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserAdminService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    public Page<UserAdminResponse> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<UserAdminResponse> searchUsers(String keyword, Pageable pageable) {
        return userRepository.findByUsernameContainingOrEmailContainingOrFullNameContaining(
                keyword, keyword, keyword, pageable)
                .map(this::toResponse);
    }

    public UserAdminResponse getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자", userId));
        return toResponse(user);
    }

    @Transactional
    public UserAdminResponse updateUserStatus(Long userId, UserStatusUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자", userId));

        if (request.getEnabled() != null) {
            if (request.getEnabled()) {
                user.enable();
            } else {
                user.disable();
            }
        }

        if (request.getLocked() != null) {
            if (request.getLocked()) {
                user.lock();
            } else {
                user.unlock();
            }
        }

        refreshTokenRepository.revokeAllUserTokens(user.getId(), LocalDateTime.now());
        return toResponse(user);
    }

    @Transactional
    public void unlockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자", userId));
        user.unlock();
        refreshTokenRepository.revokeAllUserTokens(user.getId(), LocalDateTime.now());
    }

    @Transactional
    public User updateUserState(Long userId, String state) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자", userId));

        if ("LOCKED".equals(state)) {
            user.lock();
        } else if ("INACTIVE".equals(state)) {
            user.disable();
        } else if ("ACTIVE".equals(state)) {
            user.enable();
            user.unlock();
        } else {
            throw new com.mycard.api.exception.BadRequestException(
                    "지원하지 않는 상태입니다. ACTIVE, LOCKED, INACTIVE 중 하나를 사용하세요.");
        }

        userRepository.save(user);
        refreshTokenRepository.revokeAllUserTokens(user.getId(), LocalDateTime.now());
        return user;
    }

    private UserAdminResponse toResponse(User user) {
        return UserAdminResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(MaskingUtils.maskEmail(user.getEmail()))
                .fullName(MaskingUtils.maskName(user.getFullName()))
                .phoneNumber(MaskingUtils.maskPhone(user.getPhoneNumber()))
                .enabled(user.getEnabled())
                .locked(user.getLocked())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .roles(user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toList()))
                .build();
    }
}
