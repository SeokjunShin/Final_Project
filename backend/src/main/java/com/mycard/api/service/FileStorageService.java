package com.mycard.api.service;

import com.mycard.api.entity.Attachment;
import com.mycard.api.entity.User;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.AttachmentRepository;
import com.mycard.api.repository.UserRepository;
import com.mycard.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final OwnerCheckService ownerCheckService;

    @Value("${app.upload.base-path}")
    private String uploadBasePath;

    @Value("${app.upload.allowed-extensions}")
    private String allowedExtensions;

    @Value("${app.upload.max-file-size}")
    private long maxFileSize;

    @Transactional
    public Attachment storeFile(MultipartFile file, UserPrincipal currentUser) {
        validateFile(file);

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String storedFilename = generateStoredFilename(originalFilename);
        Path targetPath = getUploadPath().resolve(storedFilename);

        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Failed to store file: {}", originalFilename, e);
            throw new BadRequestException("파일 저장에 실패했습니다.");
        }

        User user = userRepository.getReferenceById(currentUser.getId());
        Attachment attachment = new Attachment(
                user,
                originalFilename,
                storedFilename,
                targetPath.toString(),
                file.getContentType(),
                file.getSize()
        );

        return attachmentRepository.save(attachment);
    }

    @Transactional(readOnly = true)
    public Resource loadFileAsResource(Long attachmentId, UserPrincipal currentUser) {
        Attachment attachment = ownerCheckService.requireAttachmentAccess(attachmentId, currentUser);

        try {
            Path filePath = Paths.get(attachment.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new ResourceNotFoundException("파일", attachmentId);
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("파일", attachmentId);
        }
    }

    @Transactional(readOnly = true)
    public Attachment getAttachment(Long attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("첨부파일", attachmentId));
    }

    @Transactional
    public void deleteFile(Long attachmentId, UserPrincipal currentUser) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("첨부파일", attachmentId));

        if (!attachment.getUploadedBy().getId().equals(currentUser.getId()) && !currentUser.isAdmin()) {
            throw new com.mycard.api.exception.AccessDeniedException("첨부파일 삭제 권한이 없습니다.");
        }

        try {
            Path filePath = Paths.get(attachment.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.error("Failed to delete file: {}", attachment.getStoredFilename(), e);
        }

        attachmentRepository.delete(attachment);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("파일이 비어 있습니다.");
        }

        if (file.getSize() > maxFileSize) {
            throw new BadRequestException("파일 크기가 허용 범위를 초과했습니다.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BadRequestException("파일명이 올바르지 않습니다.");
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        List<String> allowed = Arrays.asList(allowedExtensions.split(","));
        if (!allowed.contains(extension)) {
            throw new BadRequestException("허용되지 않은 파일 형식입니다.");
        }

        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            throw new BadRequestException("파일 형식을 확인할 수 없습니다.");
        }
    }

    private String generateStoredFilename(String originalFilename) {
        String extension = getFileExtension(originalFilename);
        return UUID.randomUUID() + "." + extension;
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }
        return filename.substring(lastDotIndex + 1);
    }

    private Path getUploadPath() {
        return Paths.get(uploadBasePath).toAbsolutePath().normalize();
    }
}