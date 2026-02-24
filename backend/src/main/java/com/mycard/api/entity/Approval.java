package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "approvals")
@Getter
@Setter
@NoArgsConstructor
public class Approval {

    public enum ApprovalStatus {
        APPROVED, CANCELED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private Card card;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merchant_id", nullable = false)
    private Merchant merchant;

    @Column(name = "auth_code", nullable = false, unique = true, length = 20)
    private String approvalNumber;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "KRW";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApprovalStatus status = ApprovalStatus.APPROVED;

    @Transient
    private Integer installmentMonths = 0;

    @Transient
    private LocalDateTime cancelledAt;

    @Transient
    private String description;

    @Transient
    private String merchantName;

    @Transient
    private String categoryName;

    @Column(name = "approved_at", nullable = false)
    private LocalDateTime approvedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Approval(Card card, String approvalNumber, BigDecimal amount, LocalDateTime approvedAt) {
        this.card = card;
        this.approvalNumber = approvalNumber;
        this.amount = amount;
        this.approvedAt = approvedAt;
    }

    public boolean isOwnedBy(Long userId) {
        return this.card != null && this.card.isOwnedBy(userId);
    }
}
