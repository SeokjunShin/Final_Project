package com.mycard.api.service;

import com.mycard.api.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageUploadService {

    private final UploadValidationService uploadValidationService;

    @Value("${app.upload.base-path:/var/lib/mycard/uploads}")
    private String uploadBasePath;

    public String storeImage(MultipartFile file) {
        String originalFilename = uploadValidationService.validateImageUpload(file);
        String extension = uploadValidationService.extractExtension(originalFilename);

        String storedFilename = UUID.randomUUID() + "." + extension;
        // 이벤트를 위한 별도 폴더(events) 권장
        Path uploadDir = Paths.get(uploadBasePath, "events").toAbsolutePath().normalize();
        Path targetPath = uploadDir.resolve(storedFilename);

        try {
            Files.createDirectories(uploadDir);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("이벤트 이미지 저장 완료: {}", targetPath);
            return "/api/uploads/events/" + storedFilename;
        } catch (IOException e) {
            log.error("Failed to store image file: {}", originalFilename, e);
            throw new BadRequestException("이미지 저장에 실패했습니다.");
        }
    }
}
