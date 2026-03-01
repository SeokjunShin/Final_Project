package com.mycard.api.dto.coupon;

import com.mycard.api.entity.UserCoupon;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MyCouponResponse {
    private Long couponId;
    private UserCoupon.CouponStatus status;
    private LocalDateTime validUntil;
    private LocalDateTime purchasedAt;
}
