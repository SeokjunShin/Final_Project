package com.mycard.api.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class ApprovalResponse {
    private Long id;
    private Long cardId;
    private String cardMasked;
    private String merchantName;
    private String categoryName;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String authCode;
    private LocalDateTime approvedAt;
}
