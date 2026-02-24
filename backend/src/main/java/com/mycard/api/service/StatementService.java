package com.mycard.api.service;

import com.mycard.api.dto.StatementDetailResponse;
import com.mycard.api.dto.StatementListResponse;
import com.mycard.api.entity.Statement;
import com.mycard.api.entity.StatementItem;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.StatementRepository;
import com.mycard.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatementService {

    private final StatementRepository statementRepository;
    private final OwnerCheckService ownerCheckService;

    public Page<StatementListResponse> getStatements(
            Long userId,
            LocalDate fromDate,
            LocalDate toDate,
            Long cardId,
            Pageable pageable
    ) {
        Page<Statement> page;
        if (cardId != null) {
            page = statementRepository.findByUserIdAndCardIdWithPeriod(userId, cardId, fromDate, toDate, pageable);
        } else {
            page = statementRepository.findByUserIdWithPeriod(userId, fromDate, toDate, pageable);
        }
        return page.map(this::toListResponse);
    }

    public StatementDetailResponse getStatementDetail(Long statementId, UserPrincipal principal) {
        Statement statement = loadAndAuthorizeStatement(principal, statementId);
        return toDetailResponse(statement);
    }

    public String exportStatementCsv(Long statementId, UserPrincipal principal) {
        Statement statement = loadAndAuthorizeStatement(principal, statementId);

        StringBuilder sb = new StringBuilder();
        sb.append("statement_id,year,month,due_date,status,total_amount,item_id,approved_at,merchant,category,amount\n");
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        for (StatementItem item : statement.getItems()) {
            sb.append(statement.getId()).append(',')
                    .append(statement.getYear()).append(',')
                    .append(statement.getMonth()).append(',')
                    .append(statement.getDueDate()).append(',')
                    .append(statement.getStatus()).append(',')
                    .append(statement.getTotalAmount()).append(',')
                    .append(item.getId()).append(',')
                    .append(item.getTransactionDate() != null ? dtf.format(item.getTransactionDate()) : "").append(',')
                    .append(escapeCsv(item.getMerchantName())).append(',')
                    .append(escapeCsv(item.getCategoryName())).append(',')
                    .append(item.getAmount())
                    .append('\n');
        }

        return sb.toString();
    }

    public Long getStatementOwnerId(Long statementId) {
        return statementRepository.findById(statementId)
                .map(s -> s.getUser().getId())
                .orElse(null);
    }

    private Statement loadAndAuthorizeStatement(UserPrincipal principal, Long statementId) {
        Statement statement = statementRepository.findByIdWithItems(statementId)
                .orElseThrow(() -> new ResourceNotFoundException("명세서", statementId));

        if (!ownerCheckService.isAdminOrOperator(principal)) {
            ownerCheckService.requireOwner(statement.getUser().getId(), principal.getId());
        }
        return statement;
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

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
