package com.mycard.api.service;

import com.mycard.api.dto.PointPolicyResponse;
import com.mycard.api.entity.PointPolicy;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.PointPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 포인트 정책 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PointPolicyService {

    private final PointPolicyRepository policyRepository;

    /**
     * 전체 정책 목록 조회
     */
    public List<PointPolicyResponse> getAllPolicies() {
        return policyRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * 활성 정책만 조회
     */
    public List<PointPolicyResponse> getActivePolicies() {
        return policyRepository.findByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * 정책 키로 조회
     */
    public BigDecimal getPolicyValue(String policyKey) {
        return policyRepository.findByPolicyKeyAndIsActiveTrue(policyKey)
                .map(PointPolicy::getPolicyValue)
                .orElse(null);
    }

    /**
     * 정책 값 업데이트
     */
    @Transactional
    public PointPolicyResponse updatePolicy(Long policyId, BigDecimal newValue) {
        PointPolicy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("포인트 정책", policyId));

        policy.updateValue(newValue);
        return toResponse(policy);
    }

    /**
     * 정책 활성화/비활성화
     */
    @Transactional
    public PointPolicyResponse togglePolicyStatus(Long policyId) {
        PointPolicy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("포인트 정책", policyId));

        if (policy.getIsActive()) {
            policy.deactivate();
        } else {
            policy.activate();
        }
        return toResponse(policy);
    }

    private PointPolicyResponse toResponse(PointPolicy policy) {
        return PointPolicyResponse.builder()
                .id(policy.getId())
                .policyKey(policy.getPolicyKey())
                .policyName(policy.getPolicyName())
                .policyValue(policy.getPolicyValue())
                .description(policy.getDescription())
                .isActive(policy.getIsActive())
                .createdAt(policy.getCreatedAt())
                .updatedAt(policy.getUpdatedAt())
                .build();
    }
}
