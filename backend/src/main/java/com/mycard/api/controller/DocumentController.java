package com.mycard.api.controller;

import com.mycard.api.dto.DocumentResponse;
import com.mycard.api.entity.Document;
import com.mycard.api.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 문서 API 컨트롤러
 */
@Tag(name = "Documents", description = "문서 관리 API")
@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    /**
     * 문서 목록 조회
     */
    @Operation(summary = "문서 목록 조회", description = "공개된 문서 목록을 조회합니다.")
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

    /**
     * 문서 상세 조회
     */
    @Operation(summary = "문서 상세 조회", description = "특정 문서의 상세 정보를 조회합니다.")
    @GetMapping("/{documentId}")
    public ResponseEntity<DocumentResponse> getDocument(@PathVariable Long documentId) {
        DocumentResponse document = documentService.getDocument(documentId);
        return ResponseEntity.ok(document);
    }

    /**
     * 문서 다운로드
     */
    @Operation(summary = "문서 다운로드", description = "문서 파일을 다운로드합니다.")
    @GetMapping("/{documentId}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long documentId) {
        Document document = documentService.getDocumentForDownload(documentId);

        try {
            Path filePath = Paths.get(document.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(document.getContentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + document.getFileName() + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
