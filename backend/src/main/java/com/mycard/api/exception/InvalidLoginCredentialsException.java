package com.mycard.api.exception;

import lombok.Getter;

@Getter
public class InvalidLoginCredentialsException extends RuntimeException {

    private final int remainingAttempts;

    public InvalidLoginCredentialsException(String message, int remainingAttempts) {
        super(message);
        this.remainingAttempts = remainingAttempts;
    }
}
