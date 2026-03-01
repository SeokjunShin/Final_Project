package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_coupons")
@Getter
@Setter
@NoArgsConstructor
public class UserCoupon {

    public enum CouponStatus {
        AVAILABLE, USED, EXPIRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "coupon_id", nullable = false)
    private Long couponId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CouponStatus status = CouponStatus.AVAILABLE;

    @Column(name = "purchased_at", nullable = false, updatable = false)
    private LocalDateTime purchasedAt;

    @Column(name = "valid_until", nullable = false)
    private LocalDateTime validUntil;

    public UserCoupon(User user, Long couponId, CouponStatus status, LocalDateTime purchasedAt, LocalDateTime validUntil) {
        this.user = user;
        this.couponId = couponId;
        this.status = status;
        this.purchasedAt = purchasedAt;
        this.validUntil = validUntil;
    }
}
