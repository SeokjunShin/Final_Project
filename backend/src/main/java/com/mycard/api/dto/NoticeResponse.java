package com.mycard.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 공지사항 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoticeResponse {
    private Long id;
    private String category;
    private String title;
    private String content;
    private String authorName;
    private Boolean pinned;
    private Integer viewCount;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
}
