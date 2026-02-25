package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "loans")
@Getter
@Setter
@NoArgsConstructor
public class Loan {

    public enum LoanType {
        CASH_ADVANCE, CARD_LOAN
    }

    public enum LoanStatus {
        REQUESTED, APPROVED, DISBURSED, REPAID, CANCELED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "loan_type", nullable = false, length = 20)
    private LoanType loanType;

    @Column(name = "principal_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal principalAmount;

    @Column(name = "interest_rate", precision = 5, scale = 2)
    private BigDecimal interestRate = BigDecimal.ZERO;

    @Column(name = "term_months")
    private Integer termMonths;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LoanStatus status = LoanStatus.REQUESTED;

    @CreationTimestamp
    @Column(name = "requested_at", nullable = false, updatable = false)
    private LocalDateTime requestedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "disbursed_at")
    private LocalDateTime disbursedAt;

    @Column(name = "repaid_at")
    private LocalDateTime repaidAt;

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    public Loan(User user, LoanType loanType, BigDecimal principalAmount, BigDecimal interestRate, Integer termMonths) {
        this.user = user;
        this.loanType = loanType;
        this.principalAmount = principalAmount;
        this.interestRate = interestRate != null ? interestRate : BigDecimal.ZERO;
        this.termMonths = termMonths;
    }

    public boolean isOwnedBy(Long userId) {
        return user != null && user.getId().equals(userId);
    }
}
