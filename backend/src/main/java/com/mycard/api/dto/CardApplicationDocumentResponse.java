package com.mycard.api.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CardApplicationDocumentResponse {

    private Long id;
    private Long attachmentId;
    private String docType;
    private String fileName;
    private String status;
    private String rejectionReason;
    private LocalDateTime submittedAt;
}
