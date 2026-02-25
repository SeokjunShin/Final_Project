package com.mycard.api.dto.loan;

import com.mycard.api.entity.Loan;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class LoanCreateRequest {

    @NotNull(message = "대출 유형은 필수입니다.")
    private Loan.LoanType loanType;

    @NotNull(message = "대출 원금은 필수입니다.")
    @DecimalMin(value = "1", message = "대출 원금은 1 이상이어야 합니다.")
    private BigDecimal principalAmount;

    @DecimalMin(value = "0", message = "이자율은 0 이상이어야 합니다.")
    private BigDecimal interestRate;

    private Integer termMonths;
}
