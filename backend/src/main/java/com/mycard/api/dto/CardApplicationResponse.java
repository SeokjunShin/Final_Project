package com.mycard.api.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 카드 신청 응답 DTO
 */
@Data
public class CardApplicationResponse {
    
    private Long id;
    
    // 개인정보
    private String fullName;
    private String maskedSsn; // 마스킹된 주민번호 (일반)
    private String phone;
    private String email;
    private String address;
    private String addressDetail;
    
    // 직업/소득 정보
    private String employmentType;
    private String employerName;
    private String jobTitle;
    private String annualIncome; // 관리자만 볼 수 있음
    
    // 신청 카드 정보
    private String cardType;
    private String cardProduct;
    private BigDecimal requestedCreditLimit;
    
    // 상태
    private String status;
    private LocalDateTime reviewedAt;
    private String rejectionReason;
    private BigDecimal approvedCreditLimit;
    
    // 관리자용 추가 정보
    private String adminNotes;
    private String userName;
    private String userEmail;
    private String reviewerName;
    private Long issuedCardId;
    private String issuedCardNumber;
    
    // 시간
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
