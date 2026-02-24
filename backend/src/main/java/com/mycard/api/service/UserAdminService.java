package com.mycard.api.service;

import com.mycard.api.dto.UserAdminResponse;
import com.mycard.api.dto.UserStatusUpdateRequest;
import com.mycard.api.entity.Role;
import com.mycard.api.entity.User;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

/**
 * 사용자 관리 서비스 (Admin용)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserAdminService {

    private final UserRepository userRepository;

    /**
     * 사용자 목록 조회
     */
    public Page<UserAdminResponse> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    /**
     * 사용자 검색
     */
    public Page<UserAdminResponse> searchUsers(String keyword, Pageable pageable) {
        return userRepository.findByUsernameContainingOrEmailContainingOrFullNameContaining(
                keyword, keyword, keyword, pageable)
                .map(this::toResponse);
    }

    /**
     * 사용자 상세 조회
     */
    public UserAdminResponse getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자", userId));
        return toResponse(user);
    }

    /**
     * 사용자 상태 변경
     */
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

        return toResponse(user);
    }

    /**
     * 사용자 계정 잠금 해제
     */
    @Transactional
    public void unlockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자", userId));
        user.unlock();
    }

    private UserAdminResponse toResponse(User user) {
        return UserAdminResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
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
