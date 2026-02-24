package com.mycard.api.dto.point;

import com.mycard.api.entity.PointWithdrawal;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class PointWithdrawalResponse {

    private Long id;
    private BigDecimal pointsAmount;
    private BigDecimal cashAmount;
    private BigDecimal feeAmount;
    private String bankName;
    private String accountNumber;  // 마스킹됨
    private PointWithdrawal.WithdrawalStatus status;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
}
