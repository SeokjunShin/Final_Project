package com.mycard.api.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RefreshTokenRequest {

    @NotBlank(message = "Refresh token은 필수입니다.")
    private String refreshToken;
}
