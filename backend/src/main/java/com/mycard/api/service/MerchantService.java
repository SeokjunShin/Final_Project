package com.mycard.api.service;

import com.mycard.api.dto.MerchantResponse;
import com.mycard.api.entity.Merchant;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.MerchantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 가맹점 관리 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MerchantService {

    private final MerchantRepository merchantRepository;

    /**
     * 가맹점 목록 조회
     */
    public Page<MerchantResponse> getMerchants(Pageable pageable) {
        return merchantRepository.findAll(pageable).map(this::toResponse);
    }

    /**
     * 가맹점 검색
     */
    public Page<MerchantResponse> searchMerchants(String keyword, Pageable pageable) {
        return merchantRepository.findByMerchantNameContaining(keyword, pageable)
                .map(this::toResponse);
    }

    /**
     * 가맹점 상세 조회
     */
    public MerchantResponse getMerchant(Long merchantId) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new ResourceNotFoundException("가맹점", merchantId));
        return toResponse(merchant);
    }

    /**
     * 가맹점 상태 변경
     */
    @Transactional
    public MerchantResponse updateMerchantStatus(Long merchantId, String status) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new ResourceNotFoundException("가맹점", merchantId));
        
        merchant.updateStatus(Merchant.MerchantStatus.valueOf(status));
        return toResponse(merchant);
    }

    private MerchantResponse toResponse(Merchant merchant) {
        return MerchantResponse.builder()
                .id(merchant.getId())
                .merchantCode(merchant.getMerchantCode())
                .merchantName(merchant.getMerchantName())
                .businessNumber(merchant.getBusinessNumber())
                .categoryCode(merchant.getCategoryCode())
                .categoryName(merchant.getCategoryName())
                .representativeName(merchant.getRepresentativeName())
                .address(merchant.getAddress())
                .phoneNumber(merchant.getPhoneNumber())
                .status(merchant.getStatus().name())
                .createdAt(merchant.getCreatedAt())
                .updatedAt(merchant.getUpdatedAt())
                .build();
    }
}
