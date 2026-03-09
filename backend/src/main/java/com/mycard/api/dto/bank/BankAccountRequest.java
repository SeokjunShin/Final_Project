package com.mycard.api.dto.bank;

import jakarta.validation.constraints.NotBlank;
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

    @Size(max = 50, message = "예금주명은 50자 이하여야 합니다.")
    private String accountHolder;

    private Boolean setAsDefault = false;
}
