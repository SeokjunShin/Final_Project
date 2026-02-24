package com.mycard.api.repository;

import com.mycard.api.entity.PointLedger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PointLedgerRepository extends JpaRepository<PointLedger, Long> {

    @Query("SELECT pl FROM PointLedger pl WHERE pl.user.id = :userId ORDER BY pl.createdAt DESC")
    Page<PointLedger> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT pl FROM PointLedger pl WHERE pl.user.id = :userId AND pl.transactionType = :type ORDER BY pl.createdAt DESC")
    Page<PointLedger> findByUserIdAndTransactionType(
            @Param("userId") Long userId,
            @Param("type") PointLedger.TransactionType type,
            Pageable pageable);
}
