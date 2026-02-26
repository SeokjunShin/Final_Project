package com.mycard.api.dto.card;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ReissueRequestResponse {

    private Long cardId;
    private String cardNumberMasked;
    private String cardAlias;
    private Long userId;
    private String userName;
    private String userEmail;
    private LocalDateTime requestedAt;
}
