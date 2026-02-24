package com.mycard.api.repository;

import com.mycard.api.entity.PointPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PointPolicyRepository extends JpaRepository<PointPolicy, Long> {

    List<PointPolicy> findByEnabledTrue();

    Optional<PointPolicy> findFirstByEnabledTrueOrderByUpdatedAtDesc();

    default Optional<PointPolicy> findByPolicyKey(String policyKey) {
        return findFirstByEnabledTrueOrderByUpdatedAtDesc().map(policy -> {
            policy.setPolicyKey(policyKey);
            return policy;
        });
    }

    default boolean existsByPolicyKey(String policyKey) {
        return findFirstByEnabledTrueOrderByUpdatedAtDesc().isPresent();
    }

    default List<PointPolicy> findByIsActiveTrue() {
        return findByEnabledTrue();
    }

    default Optional<PointPolicy> findByPolicyKeyAndIsActiveTrue(String policyKey) {
        return findByPolicyKey(policyKey);
    }
}
