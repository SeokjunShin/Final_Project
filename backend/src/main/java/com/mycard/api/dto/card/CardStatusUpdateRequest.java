package com.mycard.api.dto.card;

import com.mycard.api.entity.Card;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CardStatusUpdateRequest {

    @NotNull(message = "상태는 필수입니다.")
    private Card.CardStatus status;
}
