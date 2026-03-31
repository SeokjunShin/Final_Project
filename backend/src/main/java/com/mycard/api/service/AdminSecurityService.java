package com.mycard.api.service;

import com.mycard.api.dto.auth.AdminPasswordResetRequest;
import com.mycard.api.entity.AuditLog;
import com.mycard.api.entity.User;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminSecurityService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional
    public void resetPasswordByPin(AdminPasswordResetRequest request) {
        User admin = userRepository.findByEmailWithRoles(request.getEmail())
                .orElseThrow(() -> new BadRequestException("관리자 계정을 찾을 수 없습니다."));

        if (!(admin.hasRole("MASTER_ADMIN") || admin.hasRole("REVIEW_ADMIN") || admin.hasRole("OPERATOR"))) {
            throw new BadRequestException("관리자 계정을 찾을 수 없습니다.");
        }

        verifyPin(admin, request.getPin());

        if (passwordEncoder.matches(request.getNewPassword(), admin.getPassword())) {
            throw new BadRequestException("기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.");
        }

        admin.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(admin);

        auditService.log(
                AuditLog.ActionType.UPDATE,
                "ADMIN_SECURITY",
                admin.getId(),
                "관리자 로그인 화면 비밀번호 재설정");
    }

    private void verifyPin(User admin, String pin) {
        if (admin.getAdminPasswordPin() == null || !admin.getAdminPasswordPin().equals(pin)) {
            throw new BadRequestException("4자리 번호가 올바르지 않습니다.");
        }
    }
}
