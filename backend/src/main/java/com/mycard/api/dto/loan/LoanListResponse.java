package com.mycard.api.dto.loan;

import com.mycard.api.entity.Loan;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class LoanListResponse {

    private Long id;
    private Loan.LoanType loanType;
    private BigDecimal principalAmount;
    private Loan.LoanStatus status;
    private LocalDateTime requestedAt;
}
