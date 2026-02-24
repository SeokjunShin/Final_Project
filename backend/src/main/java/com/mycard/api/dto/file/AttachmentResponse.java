package com.mycard.api.dto.file;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AttachmentResponse {

    private Long id;
    private String originalFilename;
    private String contentType;
    private Long fileSize;
    private LocalDateTime createdAt;
}
