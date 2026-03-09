package com.mycard.api.service;

import com.mycard.api.entity.AuditLog;
import com.mycard.api.entity.User;
import com.mycard.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserWithdrawalScheduler {

    private final UserRepository userRepository;
    private final AuditService auditService;

    @Scheduled(fixedDelay = 10000)
    @Transactional
    public void finalizePendingWithdrawals() {
        List<User> dueUsers = userRepository.findWithdrawalPendingUsersDueBefore(LocalDateTime.now());
        for (User user : dueUsers) {
            user.finalizeWithdrawal();
            userRepository.save(user);
            auditService.log(AuditLog.ActionType.DELETE, "USER_ACCOUNT", user.getId(), "회원 탈퇴 최종 처리");
            log.info("회원 탈퇴 최종 처리 완료 - userId={}", user.getId());
        }
    }
}
