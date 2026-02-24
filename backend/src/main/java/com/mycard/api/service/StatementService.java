package com.mycard.api.service;

import com.mycard.api.dto.StatementDetailResponse;
import com.mycard.api.dto.StatementListResponse;
import com.mycard.api.entity.Statement;
import com.mycard.api.entity.StatementItem;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.CardRepository;
import com.mycard.api.repository.StatementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

/**
 * 청구서 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatementService {

    private final StatementRepository statementRepository;
    private final CardRepository cardRepository;

    /**
     * 사용자의 청구서 목록 조회
     */
    public Page<StatementListResponse> getStatements(Long userId, Pageable pageable) {
        return statementRepository.findByUserId(userId, pageable)
                .map(this::toListResponse);
    }

    /**
     * 청구서 상세 조회
     */
    public StatementDetailResponse getStatementDetail(Long statementId) {
        Statement statement = statementRepository.findByIdWithItems(statementId)
                .orElseThrow(() -> new ResourceNotFoundException("청구서", statementId));

        return toDetailResponse(statement);
    }

    /**
     * 청구서 소유자 ID 조회
     */
    public Long getStatementOwnerId(Long statementId) {
        return statementRepository.findById(statementId)
                .map(s -> s.getUser().getId())
                .orElse(null);
    }

    private StatementListResponse toListResponse(Statement statement) {
        return StatementListResponse.builder()
                .id(statement.getId())
                .year(statement.getYear())
                .month(statement.getMonth())
                .totalAmount(statement.getTotalAmount())
                .paidAmount(statement.getPaidAmount())
                .dueDate(statement.getDueDate())
                .status(statement.getStatus().name())
                .createdAt(statement.getCreatedAt())
                .build();
    }

    private StatementDetailResponse toDetailResponse(Statement statement) {
        return StatementDetailResponse.builder()
                .id(statement.getId())
                .userId(statement.getUser().getId())
                .year(statement.getYear())
                .month(statement.getMonth())
                .totalAmount(statement.getTotalAmount())
                .paidAmount(statement.getPaidAmount())
                .dueDate(statement.getDueDate())
                .status(statement.getStatus().name())
                .createdAt(statement.getCreatedAt())
                .items(statement.getItems().stream()
                        .map(this::toItemResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    private StatementDetailResponse.StatementItemResponse toItemResponse(StatementItem item) {
        return StatementDetailResponse.StatementItemResponse.builder()
                .id(item.getId())
                .cardId(item.getCard() != null ? item.getCard().getId() : null)
                .cardNumber(item.getCard() != null ? maskCardNumber(item.getCard().getCardNumber()) : null)
                .approvalId(item.getApproval() != null ? item.getApproval().getId() : null)
                .approvalNumber(item.getApproval() != null ? item.getApproval().getApprovalNumber() : null)
                .merchantName(item.getMerchantName())
                .categoryName(item.getCategoryName())
                .amount(item.getAmount())
                .installmentMonth(item.getInstallmentMonth())
                .totalInstallments(item.getTotalInstallments())
                .transactionDate(item.getTransactionDate())
                .build();
    }

    private String maskCardNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 4) {
            return cardNumber;
        }
        return "**** **** **** " + cardNumber.substring(cardNumber.length() - 4);
    }
}
