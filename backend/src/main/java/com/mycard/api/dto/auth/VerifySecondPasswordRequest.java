package com.mycard.api.dto.auth;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifySecondPasswordRequest {

    @NotBlank(message = "2차 비밀번호를 입력해주세요.")
    @Pattern(regexp = "^\\d{6}$", message = "2차 비밀번호는 숫자 6자리여야 합니다.")
    @JsonAlias("secondaryPin")
    private String secondaryPassword;
}
