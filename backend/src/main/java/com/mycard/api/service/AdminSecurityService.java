package com.mycard.api.service;

import com.mycard.api.dto.admin.AdminPasswordChangeRequest;
import com.mycard.api.entity.AuditLog;
import com.mycard.api.entity.Role;
import com.mycard.api.entity.User;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.security.AdminPemKeyVerifier;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.repository.RefreshTokenRepository;
import com.mycard.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminSecurityService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminPemKeyVerifier adminPemKeyVerifier;
    private final AuditService auditService;

    @Transactional
    public void changeAdminPassword(UserPrincipal principal, AdminPasswordChangeRequest request) {
        User user = userRepository.findByIdWithRoles(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("관리자", principal.getId()));

        if (!isAdmin(user)) {
            throw new BadRequestException("관리자 계정만 비밀번호를 변경할 수 있습니다.");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("현재 비밀번호가 올바르지 않습니다.");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.");
        }

        adminPemKeyVerifier.verifyOrThrow(request.getPemKey());

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        refreshTokenRepository.revokeAllUserTokens(user.getId(), LocalDateTime.now());

        auditService.log(
                AuditLog.ActionType.UPDATE,
                "ADMIN_SECURITY",
                user.getId(),
                "관리자 비밀번호 변경 및 전체 세션 종료");
    }

    private boolean isAdmin(User user) {
        return user.getRoles().stream()
                .map(Role::getName)
                .anyMatch(role -> Role.MASTER_ADMIN.equals(role)
                        || Role.REVIEW_ADMIN.equals(role)
                        || Role.OPERATOR.equals(role));
    }
}
