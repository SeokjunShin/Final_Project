package com.mycard.api.service;

import com.mycard.api.dto.inquiry.InquiryCreateRequest;
import com.mycard.api.dto.inquiry.InquiryDetailResponse;
import com.mycard.api.dto.inquiry.InquiryListResponse;
import com.mycard.api.dto.inquiry.InquiryReplyRequest;
import com.mycard.api.dto.inquiry.InquiryReplyResponse;
import com.mycard.api.entity.AuditLog;
import com.mycard.api.entity.Inquiry;
import com.mycard.api.entity.InquiryReply;
import com.mycard.api.entity.User;
import com.mycard.api.exception.AccessDeniedException;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.InquiryReplyRepository;
import com.mycard.api.repository.InquiryRepository;
import com.mycard.api.repository.UserRepository;
import com.mycard.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final InquiryReplyRepository inquiryReplyRepository;
    private final UserRepository userRepository;
    private final OwnerCheckService ownerCheckService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<InquiryListResponse> getMyInquiries(UserPrincipal currentUser, Pageable pageable) {
        return inquiryRepository.findByUserId(currentUser.getId(), pageable)
                .map(this::toListResponse);
    }

    @Transactional(readOnly = true)
    public InquiryDetailResponse getInquiry(Long inquiryId, UserPrincipal currentUser) {
        Inquiry inquiry = inquiryRepository.findByIdWithDetails(inquiryId)
                .orElseThrow(() -> new ResourceNotFoundException("문의", inquiryId));

        if (!inquiry.isOwnedBy(currentUser.getId()) && !ownerCheckService.isAdminOrOperator(currentUser)) {
            throw new AccessDeniedException();
        }

        return toDetailResponse(inquiry);
    }

    @Transactional
    public InquiryDetailResponse createInquiry(UserPrincipal currentUser, InquiryCreateRequest request) {
        User user = userRepository.getReferenceById(currentUser.getId());

        Inquiry inquiry = new Inquiry(user, request.getCategory(), request.getTitle(), request.getContent());
        inquiryRepository.save(inquiry);

        auditService.log(AuditLog.ActionType.CREATE, "Inquiry", inquiry.getId(), "문의 생성: " + request.getTitle());

        return toDetailResponse(inquiry);
    }

    @Transactional
    public InquiryDetailResponse addReply(Long inquiryId, UserPrincipal currentUser, InquiryReplyRequest request) {
        Inquiry inquiry = inquiryRepository.findByIdWithDetails(inquiryId)
                .orElseThrow(() -> new ResourceNotFoundException("문의", inquiryId));

        if (!inquiry.isOwnedBy(currentUser.getId()) && !ownerCheckService.isAdminOrOperator(currentUser)) {
            throw new AccessDeniedException();
        }

        if (ownerCheckService.isAdminOrOperator(currentUser)
                && !currentUser.isAdmin()
                && inquiry.getAssignedOperator() != null
                && !inquiry.isAssignedTo(currentUser.getId())) {
            throw new AccessDeniedException("배정된 운영자만 답변을 등록할 수 있습니다.");
        }

        User author = userRepository.getReferenceById(currentUser.getId());
        boolean isStaffReply = ownerCheckService.isAdminOrOperator(currentUser);

        InquiryReply reply = new InquiryReply(inquiry, author, request.getContent(), isStaffReply);
        inquiryReplyRepository.save(reply);
        inquiry.addReply(reply);

        if (isStaffReply && inquiry.getStatus() == Inquiry.InquiryStatus.OPEN) {
            inquiry.setStatus(Inquiry.InquiryStatus.ASSIGNED);
            if (inquiry.getAssignedOperator() == null) {
                inquiry.setAssignedOperator(author);
            }
        }

        inquiryRepository.save(inquiry);

        auditService.log(AuditLog.ActionType.UPDATE, "Inquiry", inquiry.getId(), "문의 답변 등록");

        return toDetailResponse(inquiry);
    }

    @Transactional(readOnly = true)
    public Page<InquiryListResponse> getUnassignedInquiries(Pageable pageable) {
        return inquiryRepository.findUnassignedInquiries(pageable)
                .map(this::toListResponse);
    }

    @Transactional(readOnly = true)
    public Page<InquiryListResponse> getMyAssignedInquiries(UserPrincipal currentUser, Pageable pageable) {
        return inquiryRepository.findByAssignedOperatorId(currentUser.getId(), pageable)
                .map(this::toListResponse);
    }

    @Transactional
    public InquiryDetailResponse assignInquiry(Long inquiryId, UserPrincipal currentUser) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new ResourceNotFoundException("문의", inquiryId));

        if (inquiry.getAssignedOperator() != null) {
            throw new BadRequestException("이미 배정된 문의입니다.");
        }
        if (inquiry.getStatus() != Inquiry.InquiryStatus.OPEN) {
            throw new BadRequestException("OPEN 상태 문의만 배정할 수 있습니다.");
        }

        User operator = userRepository.getReferenceById(currentUser.getId());
        inquiry.setAssignedOperator(operator);
        inquiry.setStatus(Inquiry.InquiryStatus.ASSIGNED);
        inquiryRepository.save(inquiry);

        auditService.log(AuditLog.ActionType.UPDATE, "Inquiry", inquiry.getId(), "문의 배정");

        return toDetailResponse(inquiry);
    }

    @Transactional
    public InquiryDetailResponse resolveInquiry(Long inquiryId, UserPrincipal currentUser) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new ResourceNotFoundException("문의", inquiryId));

        if (!currentUser.isAdmin() && !inquiry.isAssignedTo(currentUser.getId())) {
            throw new AccessDeniedException("배정된 운영자 또는 관리자만 문의를 종료할 수 있습니다.");
        }
        if (inquiry.getStatus() == Inquiry.InquiryStatus.CLOSED || inquiry.getStatus() == Inquiry.InquiryStatus.ANSWERED) {
            throw new BadRequestException("이미 처리 완료된 문의입니다.");
        }

        inquiry.setStatus(Inquiry.InquiryStatus.ANSWERED);
        inquiry.setResolvedAt(LocalDateTime.now());
        inquiryRepository.save(inquiry);

        auditService.log(AuditLog.ActionType.UPDATE, "Inquiry", inquiry.getId(), "문의 종료 처리");

        return toDetailResponse(inquiry);
    }

    private InquiryListResponse toListResponse(Inquiry inquiry) {
        return InquiryListResponse.builder()
                .id(inquiry.getId())
                .category(inquiry.getCategory())
                .title(inquiry.getTitle())
                .status(inquiry.getStatus())
                .hasStaffReply(inquiry.getReplies().stream().anyMatch(InquiryReply::getIsStaffReply))
                .createdAt(inquiry.getCreatedAt())
                .build();
    }

    private InquiryDetailResponse toDetailResponse(Inquiry inquiry) {
        return InquiryDetailResponse.builder()
                .id(inquiry.getId())
                .category(inquiry.getCategory())
                .title(inquiry.getTitle())
                .content(inquiry.getContent())
                .status(inquiry.getStatus())
                .assignedOperatorName(inquiry.getAssignedOperator() != null ? inquiry.getAssignedOperator().getFullName() : null)
                .replies(inquiry.getReplies().stream().map(this::toReplyResponse).toList())
                .createdAt(inquiry.getCreatedAt())
                .resolvedAt(inquiry.getResolvedAt())
                .build();
    }

    private InquiryReplyResponse toReplyResponse(InquiryReply reply) {
        return InquiryReplyResponse.builder()
                .id(reply.getId())
                .content(reply.getContent())
                .authorName(reply.getAuthor().getFullName())
                .isStaffReply(reply.getIsStaffReply())
                .createdAt(reply.getCreatedAt())
                .build();
    }
}