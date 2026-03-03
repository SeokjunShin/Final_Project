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
public class PointGrantRequest {

    @NotNull(message = "지급할 포인트 금액을 입력해주세요.")
    @Min(value = 1, message = "최소 1포인트 이상 지급해야 합니다.")
    private Integer points;

    @NotBlank(message = "포인트 지급 사유를 입력해주세요. (예: CS 보상, 관리자 수동 지급 등)")
    private String reason;
}
