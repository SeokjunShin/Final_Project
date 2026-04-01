package com.mycard.api.validation;

public final class PasswordPolicy {

    private PasswordPolicy() {
    }

    public static final String REGEX =
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]+$";

    public static final String MESSAGE =
            "비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.";
}
