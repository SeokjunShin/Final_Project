package com.mycard.api.entity;

import com.mycard.api.config.EncryptedStringConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 카드 신청 엔티티
 * 개인정보 필드(SSN, 연소득)는 AES-GCM으로 암호화하여 저장
 */
@Entity
@Table(name = "card_applications")
@Getter
@Setter
@NoArgsConstructor
public class CardApplication {
    
    public enum ApplicationStatus {
        PENDING,    // 대기중
        REVIEWING,  // 심사중
        APPROVED,   // 승인
        REJECTED    // 거절
    }
    
    public enum EmploymentType {
        EMPLOYED,       // 직장인
        SELF_EMPLOYED,  // 자영업자
        FREELANCER,     // 프리랜서
        STUDENT,        // 학생
        HOUSEWIFE,      // 주부
        UNEMPLOYED,     // 무직
        RETIRED         // 은퇴
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // 신청자 (로그인 사용자)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    // === 개인정보 ===
    @Column(name = "full_name", nullable = false, length = 80)
    private String fullName;
    
    // 주민등록번호 (암호화 저장)
    @Column(name = "ssn_encrypted", nullable = false, length = 500)
    @Convert(converter = EncryptedStringConverter.class)
    private String ssn;
    
    @Column(name = "phone", nullable = false, length = 30)
    private String phone;
    
    @Column(name = "email", nullable = false, length = 190)
    private String email;
    
    @Column(name = "address", nullable = false, length = 255)
    private String address;
    
    @Column(name = "address_detail", length = 255)
    private String addressDetail;
    
    // === 직업/소득 정보 ===
    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", nullable = false, length = 30)
    private EmploymentType employmentType;
    
    @Column(name = "employer_name", length = 120)
    private String employerName;
    
    @Column(name = "job_title", length = 100)
    private String jobTitle;
    
    // 연소득 (암호화 저장)
    @Column(name = "annual_income_encrypted", nullable = false, length = 500)
    @Convert(converter = EncryptedStringConverter.class)
    private String annualIncome;
    
    // === 신청 카드 정보 ===
    @Column(name = "card_type", nullable = false, length = 50)
    private String cardType;  // VISA, MASTERCARD, LOCAL 등
    
    @Column(name = "card_product", nullable = false, length = 100)
    private String cardProduct;  // 플래티넘, 골드, 일반 등
    
    @Column(name = "requested_limit", precision = 12, scale = 2)
    private BigDecimal requestedCreditLimit;

    // 카드 비밀번호 (평문 저장 - 취약점 진단용)
    @Column(name = "card_password", length = 10)
    private String cardPassword;
    
    // === 상태 ===
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApplicationStatus status = ApplicationStatus.PENDING;
    
    // 처리한 관리자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;
    
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
    
    // 거절 사유
    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;
    
    // 승인된 신용한도
    @Column(name = "approved_limit", precision = 12, scale = 2)
    private BigDecimal approvedCreditLimit;
    
    // 승인 후 생성된 카드
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_card_id")
    private Card issuedCard;
    
    // 메모 (관리자용)
    @Column(name = "admin_notes", length = 1000)
    private String adminNotes;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // === 편의 메서드 ===
    
    /**
     * 마스킹된 주민번호 반환
     */
    public String getMaskedSsn() {
        if (ssn == null || ssn.length() < 7) {
            return "******-*******";
        }
        String cleaned = ssn.replaceAll("-", "");
        if (cleaned.length() >= 6) {
            return cleaned.substring(0, 6) + "-*******";
        }
        return "******-*******";
    }
    
    /**
     * 연소득을 숫자로 변환
     */
    public BigDecimal getAnnualIncomeAmount() {
        try {
            return new BigDecimal(annualIncome);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
    
    public boolean isPending() {
        return status == ApplicationStatus.PENDING || status == ApplicationStatus.REVIEWING;
    }
    
    public boolean isApproved() {
        return status == ApplicationStatus.APPROVED;
    }
    
    public boolean isRejected() {
        return status == ApplicationStatus.REJECTED;
    }
}
