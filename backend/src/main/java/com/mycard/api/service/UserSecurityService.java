package com.mycard.api.service;

import com.mycard.api.dto.user.ChangePasswordRequest;
import com.mycard.api.dto.user.SecuritySettingsRequest;
import com.mycard.api.dto.user.UpdateProfileRequest;
import com.mycard.api.dto.user.UserProfileResponse;
import com.mycard.api.entity.AuditLog;
import com.mycard.api.entity.User;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.UserRepository;
import com.mycard.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserSecurityService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile(UserPrincipal principal) {
        User user = loadUser(principal.getId());
        return toResponse(user);
    }

    @Transactional
    public UserProfileResponse updateMyProfile(UserPrincipal principal, UpdateProfileRequest request) {
        User user = loadUser(principal.getId());
        verifyCurrentPassword(user, request.getCurrentPassword());

        user.setFullName(request.getName());
        user.setPhoneNumber(request.getPhone());
        user.setAddress(request.getAddress());
        userRepository.save(user);

        auditService.log(AuditLog.ActionType.UPDATE, "USER_PROFILE", user.getId(), "사용자 프로필 수정");
        return toResponse(user);
    }

    @Transactional
    public void changePassword(UserPrincipal principal, ChangePasswordRequest request) {
        User user = loadUser(principal.getId());
        verifyCurrentPassword(user, request.getCurrentPassword());

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditService.log(AuditLog.ActionType.UPDATE, "USER_SECURITY", user.getId(), "비밀번호 변경");
    }

    @Transactional
    public UserProfileResponse updateSecuritySettings(UserPrincipal principal, SecuritySettingsRequest request) {
        User user = loadUser(principal.getId());
        verifyCurrentPassword(user, request.getCurrentPassword());

        user.setTwoFactorEnabled(request.getTwoFactorEnabled());
        userRepository.save(user);

        auditService.log(AuditLog.ActionType.UPDATE, "USER_SECURITY", user.getId(), "2FA 설정 변경");
        return toResponse(user);
    }

    private User loadUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자", userId));
    }

    private void verifyCurrentPassword(User user, String currentPassword) {
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("현재 비밀번호가 올바르지 않습니다.");
        }
    }

    private UserProfileResponse toResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getFullName())
                .phone(user.getPhoneNumber())
                .address(user.getAddress())
                .twoFactorEnabled(Boolean.TRUE.equals(user.getTwoFactorEnabled()))
                .build();
    }
}
