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

    @NotBlank(message = "은행명은 필수입니다.")
    @Size(max = 50, message = "은행명은 50자 이하여야 합니다.")
    private String bankName;

    @NotBlank(message = "계좌번호는 필수입니다.")
    @Size(max = 30, message = "계좌번호는 30자 이하여야 합니다.")
    private String accountNumber;

    @NotBlank(message = "예금주는 필수입니다.")
    @Size(max = 50, message = "예금주는 50자 이하여야 합니다.")
    private String accountHolder;
}
