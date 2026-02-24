package com.mycard.api.repository;

import com.mycard.api.entity.Merchant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MerchantRepository extends JpaRepository<Merchant, Long> {

    default Optional<Merchant> findByMerchantCode(String merchantCode) {
        return Optional.empty();
    }

    default boolean existsByMerchantCode(String merchantCode) {
        return false;
    }

    Page<Merchant> findByMerchantNameContaining(String merchantName, Pageable pageable);

    default Page<Merchant> searchMerchants(String keyword, Pageable pageable) {
        return findByMerchantNameContaining(keyword == null ? "" : keyword, pageable);
    }
}
