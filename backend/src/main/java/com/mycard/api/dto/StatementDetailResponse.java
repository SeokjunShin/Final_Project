package com.mycard.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 청구서 상세 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatementDetailResponse {
    private Long id;
    private Long userId;
    private Integer year;
    private Integer month;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private LocalDate dueDate;
    private String status;
    private LocalDateTime createdAt;
    private List<StatementItemResponse> items;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatementItemResponse {
        private Long id;
        private Long cardId;
        private String cardNumber;
        private Long approvalId;
        private String approvalNumber;
        private String merchantName;
        private String categoryName;
        private BigDecimal amount;
        private Integer installmentMonth;
        private Integer totalInstallments;
        private LocalDateTime transactionDate;
    }
}
