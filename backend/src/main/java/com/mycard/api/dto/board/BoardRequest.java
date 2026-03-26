package com.mycard.api.dto.board;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardRequest {
    @NotBlank(message = "제목은 필수입니다.")
    @Size(max = 255, message = "제목은 255자 이하여야 합니다.")
    private String title;

    @NotBlank(message = "내용은 필수입니다.")
    @Size(max = 5000, message = "내용은 5000자 이하여야 합니다.")
    private String content;

    @Size(max = 100, message = "카테고리는 100자 이하여야 합니다.")
    private String category;

    @Size(max = 1000, message = "열람 허용 대상자 목록은 1000자 이하여야 합니다.")
    private String allowedUsers;

    @Size(max = 5000, message = "답변은 5000자 이하여야 합니다.")
    private String answer;

    @JsonProperty("isPrivate")
    private boolean isPrivate;
}
