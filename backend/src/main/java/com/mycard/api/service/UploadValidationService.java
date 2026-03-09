package com.mycard.api.service;

import com.mycard.api.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UploadValidationService {

    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final Set<String> DANGEROUS_EXTENSIONS = Set.of(
            "php", "phtml", "php3", "php4", "php5",
            "jsp", "jspx", "asp", "aspx",
            "exe", "dll", "bat", "cmd", "com", "scr", "msi",
            "js", "jar", "war", "class", "sh", "ps1", "vbs"
    );

    @Value("${app.upload.allowed-extensions}")
    private String allowedExtensions;

    @Value("${app.upload.max-file-size}")
    private long maxFileSize;

    public String validateDefaultUpload(MultipartFile file) {
        return validate(file, getConfiguredAllowedExtensions(), false);
    }

    public String validateImageUpload(MultipartFile file) {
        return validate(file, IMAGE_EXTENSIONS, true);
    }

    public String extractExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastDotIndex + 1).toLowerCase(Locale.ROOT);
    }

    private String validate(MultipartFile file, Set<String> allowedExtensions, boolean imageOnly) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("업로드할 파일이 없습니다.");
        }

        if (file.getSize() > maxFileSize) {
            throw new BadRequestException("파일 크기가 허용 범위를 초과했습니다.");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        if (!StringUtils.hasText(originalFilename)) {
            throw new BadRequestException("파일명이 올바르지 않습니다.");
        }

        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new BadRequestException("파일명이 올바르지 않습니다.");
        }

        String normalizedFilename = originalFilename.trim();
        if (normalizedFilename.startsWith(".") || normalizedFilename.endsWith(".")) {
            throw new BadRequestException("파일명이 올바르지 않습니다.");
        }

        String extension = extractExtension(normalizedFilename);
        if (!allowedExtensions.contains(extension)) {
            throw new BadRequestException("허용되지 않은 파일 형식입니다.");
        }

        validateDoubleExtension(normalizedFilename);

        String contentType = file.getContentType();
        if (!StringUtils.hasText(contentType)) {
            throw new BadRequestException("파일 형식을 확인할 수 없습니다.");
        }

        if (imageOnly && !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new BadRequestException("이미지 파일만 업로드할 수 있습니다.");
        }

        return normalizedFilename;
    }

    private void validateDoubleExtension(String filename) {
        List<String> parts = Arrays.stream(filename.toLowerCase(Locale.ROOT).split("\\."))
                .filter(StringUtils::hasText)
                .collect(Collectors.toList());

        if (parts.size() < 2) {
            throw new BadRequestException("허용되지 않은 파일 형식입니다.");
        }

        for (int i = 0; i < parts.size() - 1; i++) {
            if (DANGEROUS_EXTENSIONS.contains(parts.get(i))) {
                throw new BadRequestException("이중 확장자 파일은 업로드할 수 없습니다.");
            }
        }
    }

    private Set<String> getConfiguredAllowedExtensions() {
        return Arrays.stream(allowedExtensions.split(","))
                .map(String::trim)
                .map(value -> value.toLowerCase(Locale.ROOT))
                .filter(StringUtils::hasText)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
