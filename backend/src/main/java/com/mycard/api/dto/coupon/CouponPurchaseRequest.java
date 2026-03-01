package com.mycard.api.dto.coupon;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CouponPurchaseRequest {

    @NotNull(message = "쿠폰 정보는 필수입니다.")
    @Valid
    private CouponInfo coupon;

    @NotNull(message = "수량은 필수입니다.")
    @Min(value = 1, message = "수량은 1개 이상이어야 합니다.")
    private Integer quantity;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class CouponInfo {
        @NotNull(message = "coupon.id는 필수입니다.")
        private Long id;
    }
}
