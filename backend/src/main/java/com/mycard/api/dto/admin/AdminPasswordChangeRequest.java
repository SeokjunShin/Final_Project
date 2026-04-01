package com.mycard.api.dto.admin;

import com.mycard.api.validation.PasswordPolicy;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminPasswordChangeRequest {

    @NotBlank(message = "현재 비밀번호를 입력하세요.")
    private String currentPassword;

    @NotBlank(message = "새 비밀번호를 입력하세요.")
    @Size(min = 8, max = 100, message = "새 비밀번호는 8자 이상 100자 이하여야 합니다.")
    @Pattern(regexp = PasswordPolicy.REGEX, message = PasswordPolicy.MESSAGE)
    private String newPassword;

    @NotBlank(message = "PEM 키를 입력하세요.")
    private String pemKey;
}
