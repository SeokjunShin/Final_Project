package com.mycard.api.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SecuritySettingsRequest {

    @NotBlank(message = "현재 비밀번호를 입력하세요.")
    private String currentPassword;

    @NotNull(message = "2FA 설정값이 필요합니다.")
    private Boolean twoFactorEnabled;
}
