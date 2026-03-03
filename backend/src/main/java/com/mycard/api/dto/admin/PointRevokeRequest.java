package com.mycard.api.dto.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PointRevokeRequest {

    @NotNull(message = "차감할 포인트 금액을 입력해주세요.")
    @Min(value = 1, message = "최소 1포인트 이상 차감해야 합니다.")
    private Integer points;

    @NotBlank(message = "포인트 차감 사유를 입력해주세요. (예: 시스템 오류 회수, 어뷰징 적발 등)")
    private String reason;
}
