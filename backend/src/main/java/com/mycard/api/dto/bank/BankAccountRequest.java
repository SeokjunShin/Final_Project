package com.mycard.api.dto.bank;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BankAccountRequest {

    @NotBlank(message = "은행 코드는 필수입니다.")
    @Size(max = 10)
    private String bankCode;

    @NotBlank(message = "계좌번호는 필수입니다.")
    @Pattern(regexp = "^[0-9-]{10,20}$", message = "유효한 계좌번호를 입력하세요.")
    private String accountNumber;

    @NotBlank(message = "예금주명은 필수입니다.")
    @Size(max = 50, message = "예금주명은 50자 이하여야 합니다.")
    private String accountHolder;

    private Boolean setAsDefault = false;
}
