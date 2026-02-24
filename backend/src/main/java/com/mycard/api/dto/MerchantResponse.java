package com.mycard.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 가맹점 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantResponse {
    private Long id;
    private String merchantCode;
    private String merchantName;
    private String businessNumber;
    private String categoryCode;
    private String categoryName;
    private String representativeName;
    private String address;
    private String phoneNumber;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
