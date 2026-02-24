package com.mycard.api.controller;

import com.mycard.api.dto.file.AttachmentResponse;
import com.mycard.api.entity.Attachment;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Tag(name = "파일", description = "파일 업로드/다운로드 API")
@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @Operation(summary = "파일 업로드")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttachmentResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Attachment attachment = fileStorageService.storeFile(file, currentUser);
        return ResponseEntity.ok(toResponse(attachment));
    }

    @Operation(summary = "파일 다운로드")
    @GetMapping("/{attachmentId}/download")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long attachmentId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Resource resource = fileStorageService.loadFileAsResource(attachmentId, currentUser);
        Attachment attachment = fileStorageService.getAttachment(attachmentId);

        String encodedFilename = URLEncoder.encode(attachment.getOriginalFilename(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + encodedFilename + "\"; filename*=UTF-8''" + encodedFilename)
                .body(resource);
    }

    @Operation(summary = "파일 삭제")
    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable Long attachmentId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        fileStorageService.deleteFile(attachmentId, currentUser);
        return ResponseEntity.noContent().build();
    }

    private AttachmentResponse toResponse(Attachment attachment) {
        return AttachmentResponse.builder()
                .id(attachment.getId())
                .originalFilename(attachment.getOriginalFilename())
                .contentType(attachment.getContentType())
                .fileSize(attachment.getFileSize())
                .createdAt(attachment.getCreatedAt())
                .build();
    }
}
