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
    /** 관리자/상담원 목록에서만 채움: 대출 신청 회원 ID */
    private Long userId;
    /** 관리자/상담원 목록에서만 채움: 대출 신청 회원명 */
    private String userName;
}
