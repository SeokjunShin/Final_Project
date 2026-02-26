package com.mycard.api.service;

import com.mycard.api.exception.BadRequestException;
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
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class ImageUploadService {

    @Value("${app.upload.base-path:/var/lib/mycard/uploads}")
    private String uploadBasePath;

    private final List<String> allowedExtensions = Arrays.asList("jpg", "jpeg", "png", "gif");

    public String storeImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("업로드할 파일이 없습니다.");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BadRequestException("파일명이 올바르지 않습니다.");
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!allowedExtensions.contains(extension)) {
            throw new BadRequestException("허용되지 않은 파일 형식입니다. (jpg, jpeg, png, gif만 가능)");
        }

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

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }
        return filename.substring(lastDotIndex + 1);
    }
}
