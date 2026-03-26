package com.mycard.api.exception;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class LoginBlockedException extends RuntimeException {

    private final String code;
    private final LocalDateTime lockExpiresAt;
    private final long retryAfterSeconds;

    public LoginBlockedException(String code, String message, LocalDateTime lockExpiresAt, long retryAfterSeconds) {
        super(message);
        this.code = code;
        this.lockExpiresAt = lockExpiresAt;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
