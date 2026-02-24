package com.mycard.api.repository;

import com.mycard.api.entity.Statement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface StatementRepository extends JpaRepository<Statement, Long> {

    @Query("SELECT s FROM Statement s WHERE s.user.id = :userId ORDER BY s.paymentDueDate DESC")
    Page<Statement> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("""
            SELECT s FROM Statement s
            WHERE s.user.id = :userId
              AND (:fromDate IS NULL OR s.periodStart >= :fromDate)
              AND (:toDate IS NULL OR s.periodEnd <= :toDate)
            ORDER BY s.paymentDueDate DESC
            """)
    Page<Statement> findByUserIdWithPeriod(
            @Param("userId") Long userId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    @Query("SELECT DISTINCT s FROM Statement s JOIN s.items si JOIN si.approval a WHERE s.user.id = :userId AND a.card.id = :cardId ORDER BY s.paymentDueDate DESC")
    Page<Statement> findByUserIdAndCardId(@Param("userId") Long userId, @Param("cardId") Long cardId, Pageable pageable);

    @Query("""
            SELECT DISTINCT s FROM Statement s
            JOIN s.items si
            JOIN si.approval a
            WHERE s.user.id = :userId
              AND a.card.id = :cardId
              AND (:fromDate IS NULL OR s.periodStart >= :fromDate)
              AND (:toDate IS NULL OR s.periodEnd <= :toDate)
            ORDER BY s.paymentDueDate DESC
            """)
    Page<Statement> findByUserIdAndCardIdWithPeriod(
            @Param("userId") Long userId,
            @Param("cardId") Long cardId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    @Query("SELECT s FROM Statement s LEFT JOIN FETCH s.items WHERE s.id = :id AND s.user.id = :userId")
    Optional<Statement> findByIdAndUserIdWithItems(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT s FROM Statement s LEFT JOIN FETCH s.items WHERE s.id = :id")
    Optional<Statement> findByIdWithItems(@Param("id") Long id);

    @Query("SELECT DISTINCT s FROM Statement s JOIN s.items si JOIN si.approval a WHERE s.user.id = :userId AND FUNCTION('YEAR', s.periodStart) = :year AND FUNCTION('MONTH', s.periodStart) = :month AND a.card.id = :cardId")
    Optional<Statement> findByUserIdAndYearMonthAndCardId(
            @Param("userId") Long userId,
            @Param("year") Integer year,
            @Param("month") Integer month,
            @Param("cardId") Long cardId);
}
