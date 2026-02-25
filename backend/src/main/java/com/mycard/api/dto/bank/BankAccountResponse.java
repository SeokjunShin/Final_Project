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
    private String accountNumberMasked;
    private String accountHolder;
    private Boolean isVerified;
    private Boolean isDefault;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
}
