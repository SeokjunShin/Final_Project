package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_coupons")
@Getter
@Setter
@NoArgsConstructor
public class UserCoupon {

    public enum CouponStatus {
        AVAILABLE,
        USED,
        EXPIRED
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
    @Column(name = "status", nullable = false, length = 20)
    private CouponStatus status = CouponStatus.AVAILABLE;

    @Column(name = "purchased_at", nullable = false)
    private LocalDateTime purchasedAt;

    @Column(name = "valid_until", nullable = false)
    private LocalDateTime validUntil;

    @Column(name = "pin_code", nullable = false, length = 32)
    private String pinCode;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public UserCoupon(User user, Long couponId, LocalDateTime purchasedAt, LocalDateTime validUntil) {
        this.user = user;
        this.couponId = couponId;
        this.purchasedAt = purchasedAt;
        this.validUntil = validUntil;
        this.pinCode = UUID.randomUUID().toString().replaceAll("-", "").substring(0, 16).toUpperCase();
    }
}
