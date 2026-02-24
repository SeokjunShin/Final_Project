package com.mycard.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 문서 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private Long id;
    private String category;
    private String title;
    private String description;
    private String fileName;
    private Long fileSize;
    private String contentType;
    private Boolean isPublic;
    private LocalDateTime createdAt;
}
