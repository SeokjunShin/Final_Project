package com.mycard.api.dto.bank;

import com.mycard.api.entity.BankAccountTransaction;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class BankAccountTransactionResponse {

    private Long id;
    private BankAccountTransaction.TransactionType transactionType;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private String description;
    private Long relatedLoanId;
    private LocalDateTime createdAt;
}
