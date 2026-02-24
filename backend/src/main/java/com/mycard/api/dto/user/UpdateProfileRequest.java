package com.mycard.api.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {

    @NotBlank(message = "현재 비밀번호를 입력하세요.")
    private String currentPassword;

    @NotBlank(message = "이름을 입력하세요.")
    @Size(max = 80)
    private String name;

    @Size(max = 30)
    private String phone;

    @Size(max = 255)
    private String address;
}
