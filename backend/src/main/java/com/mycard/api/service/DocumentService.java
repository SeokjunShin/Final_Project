package com.mycard.api.service;

import com.mycard.api.dto.DocumentResponse;
import com.mycard.api.entity.Attachment;
import com.mycard.api.entity.Document;
import com.mycard.api.exception.AccessDeniedException;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.AttachmentRepository;
import com.mycard.api.repository.DocumentRepository;
import com.mycard.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final AttachmentRepository attachmentRepository;
    private final OwnerCheckService ownerCheckService;

    public Page<DocumentResponse> getPublicDocuments(Pageable pageable) {
        return documentRepository.findByIsPublicTrue(pageable)
                .map(this::toResponse);
    }

    public Page<DocumentResponse> getDocumentsByCategory(Document.DocumentCategory category, Pageable pageable) {
        return documentRepository.findByIsPublicTrueAndCategory(category, pageable)
                .map(this::toResponse);
    }

    public DocumentResponse getDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("문서", documentId));

        if (!Boolean.TRUE.equals(document.getIsPublic())) {
            throw new ResourceNotFoundException("문서", documentId);
        }

        return toResponse(document);
    }

    public Attachment getDocumentAttachmentForDownload(Long documentId, UserPrincipal currentUser) {
        Document document = documentRepository.findByIdWithAttachments(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("문서", documentId));

        boolean canRead = Boolean.TRUE.equals(document.getIsPublic())
                || document.isOwnedBy(currentUser.getId())
                || ownerCheckService.isAdminOrOperator(currentUser);

        if (!canRead) {
            throw new AccessDeniedException("문서 다운로드 권한이 없습니다.");
        }

        return attachmentRepository.findByDocumentId(documentId).stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("문서 첨부파일", documentId));
    }

    private DocumentResponse toResponse(Document document) {
        return DocumentResponse.builder()
                .id(document.getId())
                .category(document.getCategory().name())
                .title(document.getTitle())
                .description(document.getDescription())
                .fileName(document.getFileName())
                .fileSize(document.getFileSize())
                .contentType(document.getContentType())
                .isPublic(document.getIsPublic())
                .createdAt(document.getCreatedAt())
                .build();
    }
}
