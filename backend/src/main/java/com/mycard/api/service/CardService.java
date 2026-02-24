package com.mycard.api.service;

import com.mycard.api.dto.card.CardResponse;
import com.mycard.api.dto.card.CardStatusUpdateRequest;
import com.mycard.api.entity.AuditLog;
import com.mycard.api.entity.Card;
import com.mycard.api.exception.BadRequestException;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.CardRepository;
import com.mycard.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CardService {

    private final CardRepository cardRepository;
    private final OwnerCheckService ownerCheckService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<CardResponse> getMyCards(UserPrincipal currentUser) {
        return cardRepository.findByUserId(currentUser.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CardResponse getCard(Long cardId, UserPrincipal currentUser) {
        Card card = cardRepository.findByIdAndUserId(cardId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("移대뱶瑜?李얠쓣 ???놁뒿?덈떎."));
        return toResponse(card);
    }

    @Transactional
    public CardResponse toggleOverseasPayment(Long cardId, UserPrincipal currentUser) {
        Card card = cardRepository.findByIdAndUserId(cardId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("移대뱶瑜?李얠쓣 ???놁뒿?덈떎."));

        boolean oldValue = card.getOverseasPaymentEnabled();
        card.setOverseasPaymentEnabled(!oldValue);
        cardRepository.save(card);

        auditService.log(AuditLog.ActionType.UPDATE, "Card", cardId,
                "?댁쇅寃곗젣 ?ㅼ젙 蹂寃? " + oldValue + " -> " + !oldValue);

        return toResponse(card);
    }

    @Transactional
    public CardResponse reportLost(Long cardId, UserPrincipal currentUser) {
        Card card = cardRepository.findByIdAndUserId(cardId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("移대뱶瑜?李얠쓣 ???놁뒿?덈떎."));

        if (card.getStatus() == Card.CardStatus.LOST) {
            throw new BadRequestException("?대? 遺꾩떎 ?좉퀬??移대뱶?낅땲??");
        }

        card.setStatus(Card.CardStatus.LOST);
        cardRepository.save(card);

        auditService.log(AuditLog.ActionType.UPDATE, "Card", cardId, "遺꾩떎 ?좉퀬 ?묒닔");

        return toResponse(card);
    }

    @Transactional
    public CardResponse requestReissue(Long cardId, UserPrincipal currentUser) {
        Card card = cardRepository.findByIdAndUserId(cardId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("移대뱶瑜?李얠쓣 ???놁뒿?덈떎."));

        if (card.getStatus() == Card.CardStatus.REISSUE_REQUESTED) {
            throw new BadRequestException("?대? ?щ컻湲??좎껌??移대뱶?낅땲??");
        }

        if (card.getStatus() != Card.CardStatus.LOST && card.getStatus() != Card.CardStatus.SUSPENDED) {
            throw new BadRequestException("遺꾩떎 ?먮뒗 留뚮즺??移대뱶留??щ컻湲??좎껌?????덉뒿?덈떎.");
        }

        card.setStatus(Card.CardStatus.REISSUE_REQUESTED);
        cardRepository.save(card);

        auditService.log(AuditLog.ActionType.UPDATE, "Card", cardId, "?щ컻湲??좎껌");

        return toResponse(card);
    }

    @Transactional
    public CardResponse updateCardStatus(Long cardId, CardStatusUpdateRequest request, UserPrincipal currentUser) {
        Card card = cardRepository.findByIdAndUserId(cardId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("移대뱶瑜?李얠쓣 ???놁뒿?덈떎."));

        Card.CardStatus oldStatus = card.getStatus();
        card.setStatus(request.getStatus());
        cardRepository.save(card);

        auditService.log(AuditLog.ActionType.UPDATE, "Card", cardId,
                "移대뱶 ?곹깭 蹂寃? " + oldStatus + " -> " + request.getStatus());

        return toResponse(card);
    }

    private CardResponse toResponse(Card card) {
        return CardResponse.builder()
                .id(card.getId())
                .cardNumberMasked(card.getMaskedCardNumber())
                .cardAlias(card.getCardAlias())
                .cardType(card.getCardType())
                .expiryDate(card.getExpiryDate())
                .creditLimit(card.getCreditLimit())
                .availableLimit(card.getAvailableLimit())
                .status(card.getStatus())
                .overseasPaymentEnabled(card.getOverseasPaymentEnabled())
                .lastUsedAt(card.getLastUsedAt())
                .build();
    }
}
