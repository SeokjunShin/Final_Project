package com.mycard.api.dto.coupon;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class UserCouponResponse {

    private Long purchaseId;
    private Long couponId;
    private String status;
    private LocalDateTime purchasedAt;
    private LocalDateTime validUntil;
    private String pinCode;
    private CouponRef coupon;

    @Getter
    @Setter
    public static class CouponRef {
        private Long id;

        public CouponRef(Long id) {
            this.id = id;
        }
    }

}
