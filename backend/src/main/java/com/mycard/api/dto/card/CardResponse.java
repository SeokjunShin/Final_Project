package com.mycard.api.dto.card;

import com.mycard.api.entity.Card;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class CardResponse {

    private Long id;
    private String cardNumberMasked;
    private String cardAlias;
    private String cardType;
    private LocalDate expiryDate;
    private BigDecimal creditLimit;
    private BigDecimal availableLimit;
    private Card.CardStatus status;
    private Boolean overseasPaymentEnabled;
    private LocalDateTime lastUsedAt;
}
