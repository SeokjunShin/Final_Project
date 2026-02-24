package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "point_withdrawals")
@Getter
@Setter
@NoArgsConstructor
public class PointWithdrawal {

    public enum WithdrawalStatus {
        REQUESTED, PROCESSED, REJECTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "points_amount", nullable = false)
    private Long pointsAmount;

    @Column(name = "cash_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal cashAmount;

    @Column(name = "fee_amount", precision = 12, scale = 2)
    private BigDecimal feeAmount = BigDecimal.ZERO;

    @Column(name = "bank_name", length = 50)
    private String bankName;

    @Column(name = "account_masked", length = 40)
    private String accountNumber;

    @Transient
    private String accountHolder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WithdrawalStatus status = WithdrawalStatus.REQUESTED;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Transient
    private String failureReason;

    @CreationTimestamp
    @Column(name = "requested_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Transient
    private LocalDateTime updatedAt;

    public PointWithdrawal(User user, BigDecimal pointsAmount, BigDecimal cashAmount) {
        this.user = user;
        this.pointsAmount = pointsAmount.longValue();
        this.cashAmount = cashAmount;
    }

    public BigDecimal getPointsAmount() {
        return BigDecimal.valueOf(pointsAmount);
    }

    public void setPointsAmount(BigDecimal pointsAmount) {
        this.pointsAmount = pointsAmount.longValue();
    }

    public boolean isOwnedBy(Long userId) {
        return this.user != null && this.user.getId().equals(userId);
    }
}
