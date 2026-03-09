package com.mycard.api.dto.bank;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class BankAccountResponse {

    private Long id;
    private String bankCode;
    private String bankName;
    private String accountNumber;  // 실제 계좌번호 (취약점 진단용)
    private String accountNumberMasked;
    private String accountHolder;
    private Boolean isVerified;
    private Boolean isDefault;
    private BigDecimal currentBalance;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
    private List<BankAccountTransactionResponse> recentTransactions;
}
