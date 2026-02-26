package com.mycard.api.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 카드 신청 요청 DTO
 */
@Data
public class CardApplicationRequest {
    
    // === 개인정보 ===
    @NotBlank(message = "이름을 입력해주세요")
    @Size(max = 80, message = "이름은 80자 이내로 입력해주세요")
    private String fullName;
    
    @NotBlank(message = "주민등록번호를 입력해주세요")
    @Pattern(regexp = "^\\d{6}-?\\d{7}$", message = "주민등록번호 형식이 올바르지 않습니다")
    private String ssn;
    
    @NotBlank(message = "연락처를 입력해주세요")
    @Pattern(regexp = "^01[0-9]-?\\d{3,4}-?\\d{4}$", message = "휴대폰 번호 형식이 올바르지 않습니다")
    private String phone;
    
    @NotBlank(message = "이메일을 입력해주세요")
    @Email(message = "이메일 형식이 올바르지 않습니다")
    private String email;
    
    @NotBlank(message = "주소를 입력해주세요")
    @Size(max = 255, message = "주소는 255자 이내로 입력해주세요")
    private String address;
    
    @Size(max = 255, message = "상세주소는 255자 이내로 입력해주세요")
    private String addressDetail;
    
    // === 직업/소득 정보 ===
    @NotBlank(message = "직업 유형을 선택해주세요")
    private String employmentType; // EMPLOYED, SELF_EMPLOYED, FREELANCER, STUDENT, HOUSEWIFE, UNEMPLOYED, RETIRED
    
    @Size(max = 120, message = "직장명은 120자 이내로 입력해주세요")
    private String employerName;
    
    @Size(max = 100, message = "직업/직책은 100자 이내로 입력해주세요")
    private String jobTitle;
    
    @NotBlank(message = "연소득을 입력해주세요")
    private String annualIncome; // 문자열로 받아 암호화 처리
    
    // === 신청 카드 정보 ===
    @NotBlank(message = "카드 종류를 선택해주세요")
    private String cardType; // VISA, MASTERCARD, LOCAL
    
    @NotBlank(message = "카드 상품을 선택해주세요")
    private String cardProduct; // 플래티넘, 골드, 일반
    
    @DecimalMin(value = "0", message = "희망 한도는 0 이상이어야 합니다")
    @DecimalMax(value = "100000000", message = "희망 한도는 1억원 이하여야 합니다")
    private BigDecimal requestedCreditLimit;

    // 카드 비밀번호 (평문 저장 - 취약점 진단용)
    @NotBlank(message = "카드 비밀번호를 입력해주세요")
    @Pattern(regexp = "^\\d{4,6}$", message = "카드 비밀번호는 4~6자리 숫자여야 합니다")
    private String cardPassword;
}
