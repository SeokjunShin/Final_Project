package com.mycard.api.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterSecondPasswordRequest {
    @NotBlank(message = "설정할 2차 비밀번호를 입력하세요.")
    private String secondaryPassword;
}
