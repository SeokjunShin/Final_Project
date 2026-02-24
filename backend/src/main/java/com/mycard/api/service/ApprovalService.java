package com.mycard.api.service;

import com.mycard.api.dto.ApprovalResponse;
import com.mycard.api.entity.Approval;
import com.mycard.api.repository.ApprovalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApprovalService {

    private final ApprovalRepository approvalRepository;

    public Page<ApprovalResponse> getApprovals(Long userId, LocalDate fromDate, LocalDate toDate, Long cardId, Pageable pageable) {
        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime to = toDate != null ? toDate.plusDays(1).atStartOfDay().minusNanos(1) : null;

        Page<Approval> page;
        if (from != null && to != null) {
            if (cardId != null) {
                page = approvalRepository.findByUserIdAndCardIdAndDateRange(userId, cardId, from, to, pageable);
            } else {
                page = approvalRepository.findByUserIdAndDateRange(userId, from, to, pageable);
            }
        } else {
            page = approvalRepository.findByUserId(userId, pageable);
        }
        return page.map(this::toResponse);
    }

    private ApprovalResponse toResponse(Approval approval) {
        return ApprovalResponse.builder()
                .id(approval.getId())
                .cardId(approval.getCard().getId())
                .cardMasked(approval.getCard().getMaskedCardNumber())
                .merchantName(approval.getMerchantName())
                .categoryName(approval.getCategoryName())
                .amount(approval.getAmount())
                .currency(approval.getCurrency())
                .status(approval.getStatus().name())
                .authCode(approval.getApprovalNumber())
                .approvedAt(approval.getApprovedAt())
                .build();
    }
}
