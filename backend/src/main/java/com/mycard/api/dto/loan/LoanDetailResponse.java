package com.mycard.api.dto.loan;

import com.mycard.api.entity.Loan;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class LoanDetailResponse {

    private Long id;
    private Loan.LoanType loanType;
    private BigDecimal principalAmount;
    private BigDecimal interestRate;
    private Integer termMonths;
    private Loan.LoanStatus status;
    private LocalDateTime requestedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime disbursedAt;
    private LocalDateTime repaidAt;
    private LocalDateTime canceledAt;
}
