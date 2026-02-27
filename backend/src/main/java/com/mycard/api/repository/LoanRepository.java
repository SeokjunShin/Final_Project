package com.mycard.api.repository;

import com.mycard.api.entity.Loan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {

    Page<Loan> findByUser_IdOrderByRequestedAtDesc(Long userId, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"user"})
    Page<Loan> findAllByOrderByRequestedAtDesc(Pageable pageable);

    Optional<Loan> findByIdAndUser_Id(Long id, Long userId);

    @Query("SELECT l FROM Loan l JOIN FETCH l.user WHERE l.id = :id")
    Optional<Loan> findByIdWithUser(@Param("id") Long id);

    /** DB에 직접 UPDATE - 승인 (목록/상세 조회 시 반영 보장) */
    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE loans SET status = 'APPROVED', approved_at = :approvedAt WHERE id = :id AND status = 'REQUESTED'", nativeQuery = true)
    int approveById(@Param("id") Long id, @Param("approvedAt") LocalDateTime approvedAt);

    /** DB에 직접 UPDATE - 출금완료 */
    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE loans SET status = 'DISBURSED', disbursed_at = :disbursedAt WHERE id = :id AND status = 'APPROVED'", nativeQuery = true)
    int disburseById(@Param("id") Long id, @Param("disbursedAt") LocalDateTime disbursedAt);

    /** DB에 직접 UPDATE - 취소/거절 */
    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE loans SET status = 'CANCELED', canceled_at = :canceledAt WHERE id = :id AND status NOT IN ('REPAID', 'CANCELED')", nativeQuery = true)
    int cancelById(@Param("id") Long id, @Param("canceledAt") LocalDateTime canceledAt);
}
