package com.mycard.api.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminPasswordResetRequest {

    @NotBlank(message = "이메일을 입력하세요.")
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    private String email;

    @NotBlank(message = "4자리 번호를 입력하세요.")
    @Pattern(regexp = "^\\d{4}$", message = "4자리 숫자를 입력하세요.")
    private String pin;

    @NotBlank(message = "새 비밀번호를 입력하세요.")
    private String newPassword;
}
