package com.mycard.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 이벤트 생성 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventCreateRequest {

    @NotBlank(message = "제목을 입력해주세요.")
    private String title;

    @NotBlank(message = "내용을 입력해주세요.")
    private String description;

    private String imageUrl;

    @NotNull(message = "시작일을 입력해주세요.")
    private LocalDateTime startDate;

    @NotNull(message = "종료일을 입력해주세요.")
    private LocalDateTime endDate;
}
