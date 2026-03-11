package com.mycard.api.dto.board;

import com.mycard.api.entity.Board;
import lombok.Builder;
import lombok.Data;

import com.fasterxml.jackson.annotation.JsonProperty;

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

    public static BoardResponse from(Board board) {
        return BoardResponse.builder()
                .id(board.getId())
                .title(board.getTitle())
                .content(board.getContent())
                .authorName(board.getAuthorName())
                .category(board.getCategory())
                .allowedUsers(board.getAllowedUsers())
                .answer(board.getAnswer())
                .answerAuthorName(board.getAnswerAuthorName())
                .isPrivate(board.isPrivate())
                .createdAt(board.getCreatedAt())
                .updatedAt(board.getUpdatedAt())
                .answerUpdatedAt(board.getAnswerUpdatedAt())
                .build();
    }
}
