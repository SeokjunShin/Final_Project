package com.mycard.api.repository;

import com.mycard.api.entity.Inquiry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    @Query("SELECT i FROM Inquiry i WHERE i.user.id = :userId ORDER BY i.createdAt DESC")
    Page<Inquiry> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT i FROM Inquiry i LEFT JOIN FETCH i.replies r LEFT JOIN FETCH r.author WHERE i.id = :id AND i.user.id = :userId")
    Optional<Inquiry> findByIdAndUserIdWithDetails(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT i FROM Inquiry i LEFT JOIN FETCH i.replies r LEFT JOIN FETCH r.author WHERE i.id = :id")
    Optional<Inquiry> findByIdWithDetails(@Param("id") Long id);

    Page<Inquiry> findByStatus(Inquiry.InquiryStatus status, Pageable pageable);

    @Query("SELECT i FROM Inquiry i WHERE i.assignedOperator.id = :operatorId ORDER BY i.createdAt DESC")
    Page<Inquiry> findByAssignedOperatorId(@Param("operatorId") Long operatorId, Pageable pageable);

    @Query("SELECT i FROM Inquiry i WHERE i.assignedOperator IS NULL AND i.status = 'OPEN' ORDER BY i.createdAt ASC")
    Page<Inquiry> findUnassignedInquiries(Pageable pageable);
}
