package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "point_ledger")
@Getter
@Setter
@NoArgsConstructor
public class PointLedger {

    public enum TransactionType {
        EARN, SPEND, CONVERT, ADJUST
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 20)
    private TransactionType transactionType;

    @Column(nullable = false)
    private Long amount;

    @Column(name = "balance_after", nullable = false)
    private Long balanceAfter;

    @Column(name = "memo", length = 255)
    private String description;

    @Column(name = "ref_type", length = 30)
    private String referenceType;

    @Column(name = "ref_id")
    private Long referenceId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public PointLedger(User user, TransactionType transactionType, BigDecimal amount,
                       BigDecimal balanceAfter, String description) {
        this.user = user;
        this.transactionType = transactionType;
        this.amount = amount.longValue();
        this.balanceAfter = balanceAfter.longValue();
        this.description = description;
    }

    public BigDecimal getAmount() {
        return BigDecimal.valueOf(amount);
    }

    public BigDecimal getBalanceAfter() {
        return BigDecimal.valueOf(balanceAfter);
    }

    public boolean isOwnedBy(Long userId) {
        return this.user != null && this.user.getId().equals(userId);
    }
}
