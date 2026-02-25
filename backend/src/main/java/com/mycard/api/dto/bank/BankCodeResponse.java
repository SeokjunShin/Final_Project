package com.mycard.api.dto.bank;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BankCodeResponse {
    private String code;
    private String name;
}
