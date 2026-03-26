package com.mycard.api.dto.auth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RegisterResponse {
    private String otpSecret;
    private String otpAuthUri;
    private String message;
}
