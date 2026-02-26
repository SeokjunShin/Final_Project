package com.mycard.api.repository;

import com.mycard.api.entity.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    @Query("SELECT d FROM Document d WHERE d.user.id = :userId ORDER BY d.createdAt DESC")
    Page<Document> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT d FROM Document d LEFT JOIN FETCH d.attachments WHERE d.id = :id AND d.user.id = :userId")
    Optional<Document> findByIdAndUserIdWithAttachments(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT d FROM Document d LEFT JOIN FETCH d.attachments WHERE d.id = :id")
    Optional<Document> findByIdWithAttachments(@Param("id") Long id);

    Page<Document> findByStatus(Document.DocumentStatus status, Pageable pageable);

    @Query("SELECT d FROM Document d WHERE d.status IN ('SUBMITTED', 'UNDER_REVIEW') ORDER BY d.createdAt ASC")
    Page<Document> findPendingDocuments(Pageable pageable);

    @Query("SELECT d FROM Document d ORDER BY d.createdAt DESC")
    Page<Document> findByIsPublicTrue(Pageable pageable);

    @Query("SELECT d FROM Document d ORDER BY d.createdAt DESC")
    Page<Document> findAllByOrderByCreatedAtDesc(Pageable pageable);

    default Page<Document> findByIsPublicTrueAndCategory(Document.DocumentCategory category, Pageable pageable) {
        return findByIsPublicTrue(pageable);
    }
}
