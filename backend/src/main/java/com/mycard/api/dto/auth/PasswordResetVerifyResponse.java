package com.mycard.api.dto.auth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PasswordResetVerifyResponse {
    private boolean success;
    private String message;
    private String resetToken;
}
