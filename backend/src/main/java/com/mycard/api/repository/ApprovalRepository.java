package com.mycard.api.repository;

import com.mycard.api.entity.Approval;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalRepository extends JpaRepository<Approval, Long> {

    @Query("SELECT a FROM Approval a JOIN FETCH a.card JOIN FETCH a.merchant WHERE a.card.user.id = :userId ORDER BY a.approvedAt DESC")
    Page<Approval> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT a FROM Approval a JOIN FETCH a.card JOIN FETCH a.merchant WHERE a.card.user.id = :userId ORDER BY a.approvedAt DESC")
    List<Approval> findTop5ByUserIdOrderByApprovedAtDesc(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT a FROM Approval a JOIN FETCH a.card JOIN FETCH a.merchant WHERE a.card.user.id = :userId AND a.card.id = :cardId AND a.approvedAt BETWEEN :start AND :end")
    Page<Approval> findByUserIdAndCardIdAndDateRange(
            @Param("userId") Long userId,
            @Param("cardId") Long cardId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);

    @Query("SELECT a FROM Approval a JOIN FETCH a.card JOIN FETCH a.merchant WHERE a.card.user.id = :userId AND a.approvedAt BETWEEN :start AND :end")
    Page<Approval> findByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);

    @Query("SELECT a FROM Approval a WHERE a.id = :id AND a.card.user.id = :userId")
    Optional<Approval> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    Optional<Approval> findByApprovalNumber(String approvalNumber);

    @Query("SELECT a FROM Approval a WHERE a.card.user.id = :userId AND a.approvedAt >= :startDate AND a.status = 'APPROVED' ORDER BY a.approvedAt ASC")
    List<Approval> findApprovedByUserIdSince(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate);
}
