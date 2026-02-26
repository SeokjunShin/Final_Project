package com.mycard.api.controller;

import com.mycard.api.service.ImageUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Tag(name = "Uploads", description = "파일 업로드 API")
@RestController
@RequestMapping("/upload")
@RequiredArgsConstructor
public class UploadController {

    private final ImageUploadService imageUploadService;

    @Operation(summary = "이미지 업로드", description = "이미지 파일을 업로드하고 접근 경로를 반환받습니다.")
    @PostMapping("/image")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        String fileUrl = imageUploadService.storeImage(file);

        Map<String, String> result = new HashMap<>();
        result.put("url", fileUrl);
        return ResponseEntity.ok(result);
    }
}
