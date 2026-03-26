package com.mycard.api.dto.board;

import com.mycard.api.entity.Board;
import lombok.Builder;
import lombok.Data;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.web.util.HtmlUtils;

import java.time.LocalDateTime;

@Data
@Builder
public class BoardResponse {
    private Long id;
    private String title;
    private String content;
    private String authorName;

    private String category;
    private String allowedUsers;
    private String answer;
    private String answerAuthorName;

    @JsonProperty("isPrivate")
    private boolean isPrivate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime answerUpdatedAt;

    private static String escapeHtml(String value) {
        return value == null ? null : HtmlUtils.htmlEscape(value);
    }

    public static BoardResponse from(Board board) {
        return BoardResponse.builder()
                .id(board.getId())
                .title(escapeHtml(board.getTitle()))
                .content(escapeHtml(board.getContent()))
                .authorName(escapeHtml(board.getAuthorName()))
                .category(board.getCategory())
                .allowedUsers(escapeHtml(board.getAllowedUsers()))
                .answer(escapeHtml(board.getAnswer()))
                .answerAuthorName(escapeHtml(board.getAnswerAuthorName()))
                .isPrivate(board.isPrivate())
                .createdAt(board.getCreatedAt())
                .updatedAt(board.getUpdatedAt())
                .answerUpdatedAt(board.getAnswerUpdatedAt())
                .build();
    }
}
