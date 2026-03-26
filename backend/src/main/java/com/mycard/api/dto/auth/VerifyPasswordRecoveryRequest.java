package com.mycard.api.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyPasswordRecoveryRequest {

    @NotBlank(message = "이메일을 입력해주세요.")
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    private String email;

    @NotBlank(message = "OTP 코드를 입력해주세요.")
    @Size(min = 6, max = 6, message = "OTP 코드는 6자리여야 합니다.")
    private String otpCode;
}
