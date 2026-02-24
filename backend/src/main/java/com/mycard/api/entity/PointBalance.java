package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "point_balance")
@Getter
@Setter
@NoArgsConstructor
public class PointBalance {

    @Id
    @Column(name = "user_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "balance", nullable = false)
    private Long balance = 0L;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PointBalance(User user) {
        this.user = user;
    }

    public void addPoints(BigDecimal points) {
        this.balance += points.longValue();
    }

    public void usePoints(BigDecimal points) {
        long use = points.longValue();
        if (this.balance < use) {
            throw new IllegalStateException("Insufficient points");
        }
        this.balance -= use;
    }

    public BigDecimal getTotalPoints() {
        return BigDecimal.valueOf(balance);
    }

    public BigDecimal getAvailablePoints() {
        return BigDecimal.valueOf(balance);
    }

    public BigDecimal getExpiringPoints() {
        return BigDecimal.ZERO;
    }

    public LocalDateTime getExpiringDate() {
        return null;
    }

    public boolean isOwnedBy(Long userId) {
        return this.user != null && this.user.getId().equals(userId);
    }
}
