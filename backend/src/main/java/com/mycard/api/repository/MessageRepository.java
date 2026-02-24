package com.mycard.api.repository;

import com.mycard.api.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE m.recipient.id = :userId ORDER BY m.createdAt DESC")
    Page<Message> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.recipient.id = :userId AND m.readAt IS NULL ORDER BY m.createdAt DESC")
    Page<Message> findUnreadByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.id = :id AND m.recipient.id = :userId")
    Optional<Message> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.recipient.id = :userId AND m.readAt IS NULL")
    long countByUserIdAndIsReadFalse(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Message m SET m.readAt = CURRENT_TIMESTAMP WHERE m.recipient.id = :userId AND m.readAt IS NULL")
    void markAllAsReadByUserId(@Param("userId") Long userId);
}
