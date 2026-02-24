package com.mycard.api.repository;

import com.mycard.api.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT al FROM AuditLog al ORDER BY al.createdAt DESC")
    Page<AuditLog> findAllOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT al FROM AuditLog al WHERE al.userId = :userId ORDER BY al.createdAt DESC")
    Page<AuditLog> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT al FROM AuditLog al WHERE al.resourceType = :resourceType ORDER BY al.createdAt DESC")
    Page<AuditLog> findByResourceType(@Param("resourceType") String resourceType, Pageable pageable);

    @Query("SELECT al FROM AuditLog al WHERE al.actionType = :actionType ORDER BY al.createdAt DESC")
    Page<AuditLog> findByActionType(@Param("actionType") AuditLog.ActionType actionType, Pageable pageable);

    @Query("SELECT al FROM AuditLog al WHERE al.createdAt BETWEEN :start AND :end ORDER BY al.createdAt DESC")
    Page<AuditLog> findByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, Pageable pageable);

    @Query("SELECT al FROM AuditLog al WHERE CAST(al.actionType AS string) = :action ORDER BY al.createdAt DESC")
    Page<AuditLog> findByAction(@Param("action") String action, Pageable pageable);

    @Query("SELECT al FROM AuditLog al WHERE " +
            "(:userId IS NULL OR al.userId = :userId) AND " +
            "(:resourceType IS NULL OR al.resourceType = :resourceType) AND " +
            "(:actionType IS NULL OR al.actionType = :actionType) AND " +
            "al.createdAt BETWEEN :start AND :end " +
            "ORDER BY al.createdAt DESC")
    Page<AuditLog> searchAuditLogs(
            @Param("userId") Long userId,
            @Param("resourceType") String resourceType,
            @Param("actionType") AuditLog.ActionType actionType,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);
}
