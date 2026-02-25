package com.mycard.api.entity;

import com.mycard.api.config.EncryptedStringConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_bank_accounts")
@Getter
@Setter
@NoArgsConstructor
public class UserBankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "bank_code", nullable = false, length = 10)
    private String bankCode;

    @Column(name = "bank_name", nullable = false, length = 50)
    private String bankName;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "account_number_encrypted", nullable = false)
    private String accountNumber;

    @Column(name = "account_number_masked", nullable = false, length = 30)
    private String accountNumberMasked;

    @Column(name = "account_holder", nullable = false, length = 50)
    private String accountHolder;

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public UserBankAccount(User user, String bankCode, String bankName, String accountNumber, String accountHolder) {
        this.user = user;
        this.bankCode = bankCode;
        this.bankName = bankName;
        this.accountNumber = accountNumber;
        this.accountNumberMasked = maskAccountNumber(accountNumber);
        this.accountHolder = accountHolder;
    }

    public void verify() {
        this.isVerified = true;
        this.verifiedAt = LocalDateTime.now();
    }

    public void setAsDefault() {
        this.isDefault = true;
    }

    public void unsetDefault() {
        this.isDefault = false;
    }

    private String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 4) {
            return "****";
        }
        int len = accountNumber.length();
        int visibleEnd = 4;
        return "*".repeat(len - visibleEnd) + accountNumber.substring(len - visibleEnd);
    }
}
