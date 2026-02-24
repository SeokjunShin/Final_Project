package com.mycard.api.repository;

import com.mycard.api.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    @Query("SELECT a FROM Attachment a WHERE a.storedFilename = :storedFilename")
    Optional<Attachment> findByStoredFilename(@Param("storedFilename") String storedFilename);

    List<Attachment> findByDocumentId(Long documentId);
}
