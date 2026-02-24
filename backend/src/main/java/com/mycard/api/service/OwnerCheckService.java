package com.mycard.api.service;

import com.mycard.api.exception.AccessDeniedException;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.AttachmentRepository;
import com.mycard.api.repository.StatementRepository;
import com.mycard.api.entity.Attachment;
import com.mycard.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 공통 Owner-check 유틸리티 서비스
 * 사용자가 특정 리소스에 대한 접근 권한이 있는지 확인합니다.
 */
@Service
@RequiredArgsConstructor
public class OwnerCheckService {

    private final StatementRepository statementRepository;
    private final AttachmentRepository attachmentRepository;

    public void requireUserRole(UserPrincipal principal) {
        if (principal == null || !principal.isUser()) {
            throw new AccessDeniedException("USER 권한이 필요합니다.");
        }
    }

    public void requireOperatorOrAdmin(UserPrincipal principal) {
        if (!isAdminOrOperator(principal)) {
            throw new AccessDeniedException("OPERATOR 또는 ADMIN 권한이 필요합니다.");
        }
    }

    public void requireOwner(Long entityUserId, Long principalUserId) {
        if (entityUserId == null || principalUserId == null || !entityUserId.equals(principalUserId)) {
            throw new AccessDeniedException("본인 소유 데이터만 접근할 수 있습니다.");
        }
    }

    public Attachment requireAttachmentAccess(Long attachmentId, UserPrincipal principal) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("첨부파일", attachmentId));

        if (isAdminOrOperator(principal)) {
            return attachment;
        }
        if (principal == null || !attachment.isAccessibleBy(principal.getId())) {
            throw new AccessDeniedException("첨부파일 접근 권한이 없습니다.");
        }
        return attachment;
    }

    /**
     * 현재 사용자가 리소스의 소유자인지 확인
     * @param resourceOwnerId 리소스 소유자 ID
     * @param currentUser 현재 인증된 사용자
     * @throws AccessDeniedException 소유자가 아닌 경우
     */
    public void checkOwnership(Long resourceOwnerId, UserPrincipal currentUser) {
        if (!isOwner(resourceOwnerId, currentUser) && !isAdminOrOperator(currentUser)) {
            throw new AccessDeniedException("이 리소스에 접근할 권한이 없습니다.");
        }
    }

    /**
     * 현재 사용자가 리소스의 소유자인지 확인 (관리자 제외)
     */
    public void checkOwnershipStrict(Long resourceOwnerId, UserPrincipal currentUser) {
        if (!isOwner(resourceOwnerId, currentUser)) {
            throw new AccessDeniedException("이 리소스에 접근할 권한이 없습니다.");
        }
    }

    /**
     * 현재 사용자가 소유자이거나 관리자인지 확인
     */
    public boolean isOwnerOrAdmin(Long resourceOwnerId, UserPrincipal currentUser) {
        return isOwner(resourceOwnerId, currentUser) || currentUser.isAdmin();
    }

    /**
     * 현재 사용자가 소유자이거나 운영자/관리자인지 확인
     */
    public boolean isOwnerOrStaff(Long resourceOwnerId, UserPrincipal currentUser) {
        return isOwner(resourceOwnerId, currentUser) || isAdminOrOperator(currentUser);
    }

    /**
     * 현재 사용자가 리소스의 소유자인지 확인
     */
    public boolean isOwner(Long resourceOwnerId, UserPrincipal currentUser) {
        if (resourceOwnerId == null || currentUser == null) {
            return false;
        }
        return resourceOwnerId.equals(currentUser.getId());
    }

    /**
     * 현재 사용자가 관리자 또는 운영자인지 확인
     */
    public boolean isAdminOrOperator(UserPrincipal currentUser) {
        return currentUser != null && (currentUser.isAdmin() || currentUser.isOperator());
    }

    /**
     * 리소스 접근 권한 확인 (Owner 또는 Staff)
     * @return 접근 가능 여부
     */
    public boolean canAccess(Long resourceOwnerId, UserPrincipal currentUser) {
        return isOwner(resourceOwnerId, currentUser) || isAdminOrOperator(currentUser);
    }

    /**
     * 청구서 소유자 확인
     */
    public void checkStatementOwner(Long statementId, UserPrincipal currentUser) {
        Long ownerId = statementRepository.findById(statementId)
                .map(s -> s.getUser().getId())
                .orElse(null);
        checkOwnership(ownerId, currentUser);
    }
}
