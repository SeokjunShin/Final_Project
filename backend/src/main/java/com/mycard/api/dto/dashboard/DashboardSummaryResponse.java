package com.mycard.api.dto.dashboard;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class DashboardSummaryResponse {

    private BigDecimal upcomingPayment;
    private BigDecimal totalAvailableLimit;
    private BigDecimal pointBalance;
    private int cardCount;
    private long unreadMessageCount;
    private List<ApprovalSummary> recentApprovals;

    @Getter
    @Builder
    public static class ApprovalSummary {
        private Long id;
        private String merchantName;
        private BigDecimal amount;
        private LocalDateTime approvedAt;
        private String status;
        private String cardMasked;
    }
}
