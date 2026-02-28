package com.mycard.api.controller;

import com.mycard.api.entity.Attachment;
import com.mycard.api.entity.Document;
import com.mycard.api.entity.User;
import com.mycard.api.repository.AttachmentRepository;
import com.mycard.api.repository.DocumentRepository;
import com.mycard.api.repository.UserRepository;
import com.mycard.api.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 사용자용 문서함 API (/docs)
 * - 내 문서 목록 조회
 * - 문서 제출 (파일 업로드)
 */
@Tag(name = "User Documents", description = "사용자 문서함 API")
@RestController
@RequestMapping("/docs")
@PreAuthorize("hasAnyRole('USER','OPERATOR','REVIEW_ADMIN','MASTER_ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class UserDocumentController {

    private final DocumentRepository documentRepository;
    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Operation(summary = "내 문서 목록 조회")
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getMyDocuments(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Page<Document> documents = documentRepository.findByUserId(
                currentUser.getId(),
                PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt")));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Document doc : documents.getContent()) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", doc.getId());

            // 첨부파일에서 원본 파일명 가져오기
            List<Attachment> attachments = attachmentRepository.findByDocumentId(doc.getId());
            String fileName = attachments.isEmpty() ? null : attachments.get(0).getOriginalFilename();
            map.put("name", fileName);

            map.put("docType", doc.getDocumentType() != null ? doc.getDocumentType().name() : null);
            map.put("status", doc.getStatus().name());
            map.put("submittedAt", doc.getCreatedAt() != null
                    ? doc.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                    : "");
            map.put("rejectionReason", doc.getReviewComment());
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    @Operation(summary = "문서 제출 (파일 업로드)")
    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "docType", required = false, defaultValue = "OTHER") String docType,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        // 1. Document 엔트리 생성
        User user = userRepository.getReferenceById(currentUser.getId());
        Document document = new Document();
        document.setUser(user);
        document.setStatus(Document.DocumentStatus.SUBMITTED);

        try {
            document.setDocumentType(Document.DocumentType.valueOf(docType.toUpperCase()));
        } catch (IllegalArgumentException e) {
            document.setDocumentType(Document.DocumentType.OTHER);
        }

        document = documentRepository.save(document);

        // 2. 파일을 디스크에 저장
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String storedFilename = UUID.randomUUID() + "_" + originalFilename;
        Path uploadPath = Paths.get(uploadDir);
        Path targetPath = uploadPath.resolve(storedFilename);

        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("파일 저장 실패: {}", originalFilename, e);
            throw new RuntimeException("파일 저장에 실패했습니다.");
        }

        // 3. Attachment 생성 (document_id를 포함하여 CHECK 제약 조건 충족)
        Attachment attachment = new Attachment(
                user,
                originalFilename,
                storedFilename,
                targetPath.toString(),
                file.getContentType(),
                file.getSize());
        attachment.setDocument(document);
        attachmentRepository.save(attachment);

        // 4. 응답
        Map<String, Object> result = new HashMap<>();
        result.put("id", document.getId());
        result.put("name", attachment.getOriginalFilename());
        result.put("docType", document.getDocumentType().name());
        result.put("status", document.getStatus().name());

        return ResponseEntity.ok(result);
    }
}
