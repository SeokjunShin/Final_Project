package com.mycard.api.dto.inquiry;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class InquiryReplyResponse {

    private Long id;
    private String content;
    private String authorName;
    private Boolean isStaffReply;
    private LocalDateTime createdAt;
}
