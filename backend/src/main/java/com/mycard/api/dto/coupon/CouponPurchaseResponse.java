package com.mycard.api.dto.coupon;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CouponPurchaseResponse {
    private boolean success;
    private Long deductedPoints;
}
