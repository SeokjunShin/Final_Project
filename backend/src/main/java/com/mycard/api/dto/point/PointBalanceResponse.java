package com.mycard.api.dto.point;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class PointBalanceResponse {

    private BigDecimal totalPoints;
    private BigDecimal availablePoints;
    private BigDecimal expiringPoints;
    private LocalDateTime expiringDate;
}
