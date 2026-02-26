package com.mycard.api.dto.bank;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

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
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
}
