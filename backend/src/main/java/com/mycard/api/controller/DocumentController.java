package com.mycard.api.controller;

import com.mycard.api.dto.DocumentResponse;
import com.mycard.api.entity.Attachment;
import com.mycard.api.entity.Document;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.DocumentService;
import com.mycard.api.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Tag(name = "Documents", description = "문서 API")
@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
@Slf4j
public class DocumentController {

    private final DocumentService documentService;
    private final FileStorageService fileStorageService;

    @Operation(summary = "문서 목록 조회")
    @GetMapping
    public ResponseEntity<Page<DocumentResponse>> getDocuments(
            @RequestParam(required = false) String category,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<DocumentResponse> documents;
        if (category != null && !category.isEmpty()) {
            Document.DocumentCategory cat = Document.DocumentCategory.valueOf(category.toUpperCase());
            documents = documentService.getDocumentsByCategory(cat, pageable);
        } else {
            documents = documentService.getPublicDocuments(pageable);
        }

        return ResponseEntity.ok(documents);
    }

    @Operation(summary = "문서 상세 조회")
    @GetMapping("/{documentId}")
    public ResponseEntity<DocumentResponse> getDocument(@PathVariable Long documentId) {
        DocumentResponse document = documentService.getDocument(documentId);
        return ResponseEntity.ok(document);
    }

    @Operation(summary = "문서 다운로드", description = "Owner/Staff 권한 검증 후 다운로드")
    @GetMapping("/{documentId}/download")
    @PreAuthorize("hasAnyRole('USER','OPERATOR','REVIEW_ADMIN','MASTER_ADMIN')")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long documentId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("문서 다운로드 요청: id={}, user={}", documentId, currentUser.getUsername());
        Attachment attachment = documentService.getDocumentAttachmentForDownload(documentId, currentUser);
        Resource resource = fileStorageService.loadFileAsResource(attachment.getId(), currentUser);

        String encodedFilename = URLEncoder.encode(attachment.getOriginalFilename(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + encodedFilename + "\"; filename*=UTF-8''" + encodedFilename)
                .body(resource);
    }
}
