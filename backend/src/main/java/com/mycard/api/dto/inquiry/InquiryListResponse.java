package com.mycard.api.dto.inquiry;

import com.mycard.api.entity.Inquiry;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class InquiryListResponse {

    private Long id;
    private Inquiry.InquiryCategory category;
    private String title;
    private Inquiry.InquiryStatus status;
    private boolean hasStaffReply;
    private LocalDateTime createdAt;
}
