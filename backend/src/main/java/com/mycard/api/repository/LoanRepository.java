package com.mycard.api.repository;

import com.mycard.api.entity.Loan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {

    Page<Loan> findByUser_IdOrderByRequestedAtDesc(Long userId, Pageable pageable);

    Optional<Loan> findByIdAndUser_Id(Long id, Long userId);

    @Query("SELECT l FROM Loan l JOIN FETCH l.user WHERE l.id = :id")
    Optional<Loan> findByIdWithUser(@Param("id") Long id);
}
