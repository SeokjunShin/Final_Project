package com.mycard.api.dto.inquiry;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class InquiryReplyRequest {

    @NotBlank(message = "답변 내용은 필수입니다.")
    @Size(max = 5000, message = "답변은 5000자 이하여야 합니다.")
    private String content;
}
