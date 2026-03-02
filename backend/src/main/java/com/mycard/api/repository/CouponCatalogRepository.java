package com.mycard.api.repository;

import com.mycard.api.entity.CouponCatalog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CouponCatalogRepository extends JpaRepository<CouponCatalog, Long> {
    Optional<CouponCatalog> findByIdAndActiveTrue(Long id);
}
