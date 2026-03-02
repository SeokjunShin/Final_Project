package com.mycard.api.dto.auth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class VerifySecondPasswordResponse {
    private boolean success;
    private String message;
}
