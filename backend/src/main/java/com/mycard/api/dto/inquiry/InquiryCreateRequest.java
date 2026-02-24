package com.mycard.api.dto.inquiry;

import com.mycard.api.entity.Inquiry;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class InquiryCreateRequest {

    @NotNull(message = "문의 유형은 필수입니다.")
    private Inquiry.InquiryCategory category;

    @NotBlank(message = "제목은 필수입니다.")
    @Size(max = 200, message = "제목은 200자 이하여야 합니다.")
    private String title;

    @NotBlank(message = "내용은 필수입니다.")
    @Size(max = 5000, message = "내용은 5000자 이하여야 합니다.")
    private String content;
}
