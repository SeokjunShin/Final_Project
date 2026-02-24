package com.mycard.api.repository;

import com.mycard.api.entity.PointWithdrawal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PointWithdrawalRepository extends JpaRepository<PointWithdrawal, Long> {

    @Query("SELECT pw FROM PointWithdrawal pw WHERE pw.user.id = :userId ORDER BY pw.createdAt DESC")
    Page<PointWithdrawal> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT pw FROM PointWithdrawal pw WHERE pw.id = :id AND pw.user.id = :userId")
    Optional<PointWithdrawal> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(pw.cashAmount), 0) FROM PointWithdrawal pw " +
            "WHERE pw.user.id = :userId AND pw.status IN ('REQUESTED', 'PROCESSED') " +
            "AND pw.createdAt >= :since")
    BigDecimal sumDailyWithdrawalAmount(@Param("userId") Long userId, @Param("since") LocalDateTime since);
}
