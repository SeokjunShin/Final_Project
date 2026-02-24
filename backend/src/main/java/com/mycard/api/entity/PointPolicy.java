package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "point_policies")
@Getter
@Setter
@NoArgsConstructor
public class PointPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "policy_name", nullable = false, length = 100)
    private String policyName;

    @Column(name = "fee_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal feeRate = BigDecimal.ZERO;

    @Column(name = "daily_withdrawal_limit_points", nullable = false)
    private Long dailyWithdrawalLimitPoints = 50000L;

    @Column(name = "min_withdraw_points", nullable = false)
    private Long minWithdrawPoints = 1000L;

    @Column(name = "max_withdraw_points", nullable = false)
    private Long maxWithdrawPoints = 50000L;

    @Column(name = "active", nullable = false)
    private Boolean enabled = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by", nullable = false)
    private User updatedBy;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Transient
    private String policyKey;

    @Transient
    private BigDecimal policyValue;

    @Transient
    private String description;

    @Transient
    private LocalDateTime createdAt;

    public PointPolicy(String policyKey, String policyName, BigDecimal policyValue, String description) {
        this.policyKey = policyKey;
        this.policyName = policyName;
        this.policyValue = policyValue;
        this.description = description;
    }

    public boolean getIsActive() {
        return Boolean.TRUE.equals(enabled);
    }

    public void setIsActive(Boolean active) {
        this.enabled = active;
    }

    public void updateValue(BigDecimal newValue) {
        this.policyValue = newValue;
        if ("CONVERSION_FEE_RATE".equals(policyKey)) {
            this.feeRate = newValue;
        } else if ("DAILY_WITHDRAWAL_LIMIT".equals(policyKey)) {
            this.dailyWithdrawalLimitPoints = newValue.longValue();
        } else if ("MIN_WITHDRAWAL_POINTS".equals(policyKey)) {
            this.minWithdrawPoints = newValue.longValue();
        }
    }

    public void activate() {
        this.enabled = true;
    }

    public void deactivate() {
        this.enabled = false;
    }

    public String getPolicyKey() {
        return policyKey != null ? policyKey : "DEFAULT_POLICY";
    }

    public BigDecimal getPolicyValue() {
        if ("CONVERSION_FEE_RATE".equals(policyKey)) {
            return feeRate;
        }
        if ("DAILY_WITHDRAWAL_LIMIT".equals(policyKey)) {
            return BigDecimal.valueOf(dailyWithdrawalLimitPoints);
        }
        if ("MIN_WITHDRAWAL_POINTS".equals(policyKey)) {
            return BigDecimal.valueOf(minWithdrawPoints);
        }
        if ("MAX_WITHDRAWAL_POINTS".equals(policyKey)) {
            return BigDecimal.valueOf(maxWithdrawPoints);
        }
        return policyValue != null ? policyValue : feeRate;
    }
}
