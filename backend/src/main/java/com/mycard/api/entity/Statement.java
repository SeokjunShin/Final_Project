package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "statements")
@Getter
@Setter
@NoArgsConstructor
public class Statement {

    public enum StatementStatus {
        DRAFT, ISSUED, PAID
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "due_date", nullable = false)
    private LocalDate paymentDueDate;

    @Column(name = "due_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StatementStatus status = StatementStatus.ISSUED;

    @OneToMany(mappedBy = "statement", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StatementItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Transient
    private Card card;

    @Transient
    private BigDecimal minimumPayment;

    @Transient
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Transient
    private Boolean paid = false;

    public Statement(User user, Card card, Integer billingYear, Integer billingMonth,
                     LocalDate billingDate, LocalDate paymentDueDate, BigDecimal totalAmount) {
        this.user = user;
        this.card = card;
        this.periodStart = billingDate != null ? billingDate.withDayOfMonth(1) : null;
        this.periodEnd = billingDate != null ? billingDate.withDayOfMonth(billingDate.lengthOfMonth()) : null;
        this.paymentDueDate = paymentDueDate;
        this.totalAmount = totalAmount;
    }

    public Integer getBillingYear() {
        return periodStart != null ? periodStart.getYear() : null;
    }

    public Integer getBillingMonth() {
        return periodStart != null ? periodStart.getMonthValue() : null;
    }

    public LocalDate getBillingDate() {
        return periodStart;
    }

    public void setBillingYear(Integer year) {
        if (year != null && periodStart != null) {
            periodStart = periodStart.withYear(year);
        }
    }

    public void setBillingMonth(Integer month) {
        if (month != null && periodStart != null) {
            periodStart = periodStart.withMonth(month);
        }
    }

    public void setBillingDate(LocalDate date) {
        this.periodStart = date;
    }

    public LocalDate getDueDate() {
        return paymentDueDate;
    }

    public StatementStatus getStatus() {
        if (Boolean.TRUE.equals(paid)) {
            return StatementStatus.PAID;
        }
        return status;
    }

    public Integer getYear() {
        return getBillingYear();
    }

    public Integer getMonth() {
        return getBillingMonth();
    }

    public void addItem(StatementItem item) {
        items.add(item);
        item.setStatement(this);
    }

    public boolean isOwnedBy(Long userId) {
        return this.user != null && this.user.getId().equals(userId);
    }
}
