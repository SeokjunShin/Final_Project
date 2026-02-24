package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "merchants")
@Getter
@Setter
@NoArgsConstructor
public class Merchant {

    public enum MerchantStatus {
        ACTIVE, INACTIVE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Transient
    private String merchantCode;

    @Column(name = "name", nullable = false, length = 120)
    private String merchantName;

    @Transient
    private String businessNumber;

    @Transient
    private String categoryCode;

    @Column(name = "category", nullable = false, length = 60)
    private String categoryName;

    @Transient
    private String address;

    @Transient
    private String representativeName;

    @Transient
    private String phoneNumber;

    @Transient
    private MerchantStatus status = MerchantStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public Merchant(String merchantCode, String merchantName) {
        this.merchantCode = merchantCode;
        this.merchantName = merchantName;
    }

    public void updateStatus(MerchantStatus status) {
        this.status = status;
    }
}
