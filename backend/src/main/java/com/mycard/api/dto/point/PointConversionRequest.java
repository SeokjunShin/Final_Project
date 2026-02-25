package com.mycard.api.dto.point;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class PointConversionRequest {

    @NotNull(message = "전환할 포인트는 필수입니다.")
    @DecimalMin(value = "1000", message = "최소 1000 포인트부터 전환할 수 있습니다.")
    private BigDecimal points;

    // 등록된 계좌 ID (null이면 기본 계좌 사용)
    private Long accountId;
}
