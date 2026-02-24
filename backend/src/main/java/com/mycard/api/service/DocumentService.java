package com.mycard.api.service;

import com.mycard.api.dto.DocumentResponse;
import com.mycard.api.entity.Document;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 문서 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocumentService {

    private final DocumentRepository documentRepository;

    /**
     * 공개 문서 목록 조회
     */
    public Page<DocumentResponse> getPublicDocuments(Pageable pageable) {
        return documentRepository.findByIsPublicTrue(pageable)
                .map(this::toResponse);
    }

    /**
     * 카테고리별 문서 목록 조회
     */
    public Page<DocumentResponse> getDocumentsByCategory(Document.DocumentCategory category, Pageable pageable) {
        return documentRepository.findByIsPublicTrueAndCategory(category, pageable)
                .map(this::toResponse);
    }

    /**
     * 문서 상세 조회
     */
    public DocumentResponse getDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("문서", documentId));

        if (!document.getIsPublic()) {
            throw new ResourceNotFoundException("문서", documentId);
        }

        return toResponse(document);
    }

    /**
     * 문서 파일 경로 조회 (다운로드용)
     */
    public Document getDocumentForDownload(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("문서", documentId));

        if (!document.getIsPublic()) {
            throw new ResourceNotFoundException("문서", documentId);
        }

        return document;
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
