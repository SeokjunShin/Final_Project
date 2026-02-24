package com.mycard.api.dto.point;

import com.mycard.api.entity.PointLedger;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class PointLedgerResponse {

    private Long id;
    private PointLedger.TransactionType transactionType;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private String description;
    private LocalDateTime createdAt;
}
