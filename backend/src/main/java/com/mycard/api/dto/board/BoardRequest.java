package com.mycard.api.dto.board;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardRequest {
    private String title;
    private String content;

    private String category;
    private String allowedUsers;
    private String answer;

    @JsonProperty("isPrivate")
    private boolean isPrivate;
}
