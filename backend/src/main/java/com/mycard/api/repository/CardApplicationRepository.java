package com.mycard.api.repository;

import com.mycard.api.entity.CardApplication;
import com.mycard.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CardApplicationRepository extends JpaRepository<CardApplication, Long> {
    
    // 사용자별 신청 목록
    List<CardApplication> findByUserOrderByCreatedAtDesc(User user);
    
    // 사용자별 신청 목록 (페이징)
    Page<CardApplication> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    // 상태별 신청 목록
    List<CardApplication> findByStatusOrderByCreatedAtDesc(CardApplication.ApplicationStatus status);
    
    // 상태별 신청 목록 (페이징)
    Page<CardApplication> findByStatusOrderByCreatedAtDesc(CardApplication.ApplicationStatus status, Pageable pageable);
    
    // 대기중 신청 건수
    long countByStatus(CardApplication.ApplicationStatus status);
    
    // 사용자의 대기중인 신청 확인
    @Query("SELECT c FROM CardApplication c WHERE c.user = :user AND c.status IN ('PENDING', 'REVIEWING')")
    List<CardApplication> findPendingByUser(@Param("user") User user);
    
    // 사용자별 신청 조회 (소유권 확인용)
    Optional<CardApplication> findByIdAndUser(Long id, User user);
    
    // 전체 목록 (관리자용)
    @Query("SELECT c FROM CardApplication c ORDER BY " +
           "CASE c.status WHEN 'PENDING' THEN 1 WHEN 'REVIEWING' THEN 2 ELSE 3 END, " +
           "c.createdAt DESC")
    Page<CardApplication> findAllForAdmin(Pageable pageable);
    
    // 검색 (관리자용)
    @Query("SELECT c FROM CardApplication c WHERE " +
           "c.fullName LIKE %:keyword% OR " +
           "c.email LIKE %:keyword% OR " +
           "c.phone LIKE %:keyword% " +
           "ORDER BY c.createdAt DESC")
    Page<CardApplication> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
