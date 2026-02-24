package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "statement_items")
@Getter
@Setter
@NoArgsConstructor
public class StatementItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "statement_id", nullable = false)
    private Statement statement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approval_id", nullable = false)
    private Approval approval;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Transient
    private String installmentInfo;

    @Transient
    private String description;

    public StatementItem(LocalDateTime transactionDate, String merchantName, BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDateTime getTransactionDate() {
        return approval != null ? approval.getApprovedAt() : null;
    }

    public String getMerchantName() {
        if (approval != null && approval.getMerchant() != null) {
            return approval.getMerchant().getMerchantName();
        }
        return approval != null ? approval.getMerchantName() : null;
    }

    public String getCategoryName() {
        if (approval != null && approval.getMerchant() != null) {
            return approval.getMerchant().getCategoryName();
        }
        return approval != null ? approval.getCategoryName() : null;
    }

    public Integer getInstallmentMonth() {
        return approval != null && approval.getInstallmentMonths() != null ? approval.getInstallmentMonths() : 0;
    }

    public Integer getTotalInstallments() {
        return getInstallmentMonth();
    }

    public Card getCard() {
        return approval != null ? approval.getCard() : null;
    }
}
