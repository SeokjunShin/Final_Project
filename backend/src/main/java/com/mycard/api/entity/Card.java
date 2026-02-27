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

@Entity
@Table(name = "cards")
@Getter
@Setter
@NoArgsConstructor
public class Card {

    public enum CardStatus {
        ACTIVE, SUSPENDED, LOST, REISSUE_REQUESTED, REISSUED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "masked_pan", nullable = false, length = 25)
    private String cardNumber;

    @Column(name = "card_name", nullable = false, length = 80)
    private String cardAlias;

    @Column(name = "network", nullable = false, length = 20)
    private String cardType;

    @Column(name = "issued_at")
    private LocalDate expiryDate;

    @Column(name = "limit_amount", precision = 12, scale = 2)
    private BigDecimal creditLimit;

    @Column(name = "available_limit", precision = 12, scale = 2)
    private BigDecimal availableLimit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CardStatus status = CardStatus.ACTIVE;

    @Column(name = "overseas_enabled", nullable = false)
    private Boolean overseasPaymentEnabled = false;

    @Transient
    private LocalDateTime lastUsedAt;

    @Column(name = "last4", length = 4)
    private String last4;

    // 카드 비밀번호 (평문 저장 - 취약점 진단용)
    @Column(name = "card_password", length = 10)
    private String cardPassword;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Card(User user, String cardNumber, String cardType, LocalDate expiryDate) {
        this.user = user;
        this.cardNumber = cardNumber;
        this.cardType = cardType;
        this.expiryDate = expiryDate;
    }

    public String getMaskedCardNumber() {
        // 카드번호 그대로 반환 (DB에 저장된 형식 그대로)
        return cardNumber;
    }

    public boolean isOwnedBy(Long userId) {
        return this.user != null && this.user.getId().equals(userId);
    }
}
