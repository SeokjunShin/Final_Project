package com.mycard.api.dto.inquiry;

import com.mycard.api.entity.Inquiry;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class InquiryDetailResponse {

    private Long id;
    private Inquiry.InquiryCategory category;
    private String title;
    private String content;
    private Inquiry.InquiryStatus status;
    private String assignedOperatorName;
    private List<InquiryReplyResponse> replies;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
