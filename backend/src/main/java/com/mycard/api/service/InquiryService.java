package com.mycard.api.service;

import com.mycard.api.dto.inquiry.*;
import com.mycard.api.entity.AuditLog;
import com.mycard.api.entity.Inquiry;
import com.mycard.api.entity.InquiryReply;
import com.mycard.api.entity.User;
import com.mycard.api.exception.AccessDeniedException;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.InquiryRepository;
import com.mycard.api.repository.InquiryReplyRepository;
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
                .orElseThrow(() -> new ResourceNotFoundException("臾몄쓽瑜?李얠쓣 ???놁뒿?덈떎."));

        // 蹂몄씤 臾몄쓽?닿굅???댁쁺??愿由ъ옄留?議고쉶 媛??
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

        auditService.log(AuditLog.ActionType.CREATE, "Inquiry", inquiry.getId(),
                "臾몄쓽 ?깅줉: " + request.getTitle());

        return toDetailResponse(inquiry);
    }

    @Transactional
    public InquiryDetailResponse addReply(Long inquiryId, UserPrincipal currentUser, InquiryReplyRequest request) {
        Inquiry inquiry = inquiryRepository.findByIdWithDetails(inquiryId)
                .orElseThrow(() -> new ResourceNotFoundException("臾몄쓽瑜?李얠쓣 ???놁뒿?덈떎."));

        // 蹂몄씤 臾몄쓽?닿굅???댁쁺??愿由ъ옄留??듬? 媛??
        if (!inquiry.isOwnedBy(currentUser.getId()) && !ownerCheckService.isAdminOrOperator(currentUser)) {
            throw new AccessDeniedException();
        }

        User author = userRepository.getReferenceById(currentUser.getId());
        boolean isStaffReply = ownerCheckService.isAdminOrOperator(currentUser);

        InquiryReply reply = new InquiryReply(inquiry, author, request.getContent(), isStaffReply);
        inquiry.addReply(reply);

        // ?댁쁺???듬? ???곹깭 蹂寃?
        if (isStaffReply && inquiry.getStatus() == Inquiry.InquiryStatus.OPEN) {
            inquiry.setStatus(Inquiry.InquiryStatus.ASSIGNED);
        }

        inquiryRepository.save(inquiry);

        auditService.log(AuditLog.ActionType.UPDATE, "Inquiry", inquiry.getId(),
                "臾몄쓽 ?듬? 異붽? (staff: " + isStaffReply + ")");

        return toDetailResponse(inquiry);
    }

    // === ?댁쁺?먯슜 硫붿꽌??===

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
                .orElseThrow(() -> new ResourceNotFoundException("臾몄쓽瑜?李얠쓣 ???놁뒿?덈떎."));

        if (inquiry.getAssignedOperator() != null) {
            throw new BadRequestException("?대? 諛곗젙??臾몄쓽?낅땲??");
        }

        User operator = userRepository.getReferenceById(currentUser.getId());
        inquiry.setAssignedOperator(operator);
        inquiry.setStatus(Inquiry.InquiryStatus.ASSIGNED);
        inquiryRepository.save(inquiry);

        auditService.log(AuditLog.ActionType.UPDATE, "Inquiry", inquiry.getId(),
                "臾몄쓽 諛곗젙: " + currentUser.getUsername());

        return toDetailResponse(inquiry);
    }

    @Transactional
    public InquiryDetailResponse resolveInquiry(Long inquiryId, UserPrincipal currentUser) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new ResourceNotFoundException("臾몄쓽瑜?李얠쓣 ???놁뒿?덈떎."));

        inquiry.setStatus(Inquiry.InquiryStatus.ANSWERED);
        inquiry.setResolvedAt(LocalDateTime.now());
        inquiryRepository.save(inquiry);

        auditService.log(AuditLog.ActionType.UPDATE, "Inquiry", inquiry.getId(), "臾몄쓽 ?닿껐 ?꾨즺");

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
                .assignedOperatorName(inquiry.getAssignedOperator() != null ?
                        inquiry.getAssignedOperator().getFullName() : null)
                .replies(inquiry.getReplies().stream()
                        .map(this::toReplyResponse)
                        .toList())
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
