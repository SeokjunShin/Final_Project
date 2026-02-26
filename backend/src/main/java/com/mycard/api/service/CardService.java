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
                                .orElseThrow(() -> new ResourceNotFoundException("카드를 찾을 수 없습니다."));
                return toResponse(card);
        }

        @Transactional
        public CardResponse toggleOverseasPayment(Long cardId, UserPrincipal currentUser) {
                Card card = cardRepository.findByIdAndUserId(cardId, currentUser.getId())
                                .orElseThrow(() -> new ResourceNotFoundException("카드를 찾을 수 없습니다."));

                boolean oldValue = card.getOverseasPaymentEnabled();
                card.setOverseasPaymentEnabled(!oldValue);
                cardRepository.save(card);

                auditService.log(AuditLog.ActionType.UPDATE, "Card", cardId,
                                "해외결제 설정 변경: " + oldValue + " -> " + !oldValue);

                return toResponse(card);
        }

        @Transactional
        public CardResponse reportLost(Long cardId, UserPrincipal currentUser) {
                Card card = cardRepository.findByIdAndUserId(cardId, currentUser.getId())
                                .orElseThrow(() -> new ResourceNotFoundException("카드를 찾을 수 없습니다."));

                if (card.getStatus() == Card.CardStatus.LOST) {
                        throw new BadRequestException("이미 분실 신고된 카드입니다.");
                }

                card.setStatus(Card.CardStatus.LOST);
                cardRepository.save(card);

                auditService.log(AuditLog.ActionType.UPDATE, "Card", cardId, "분실 신고 접수");

                return toResponse(card);
        }

        @Transactional
        public CardResponse requestReissue(Long cardId, UserPrincipal currentUser) {
                Card card = cardRepository.findByIdAndUserId(cardId, currentUser.getId())
                                .orElseThrow(() -> new ResourceNotFoundException("카드를 찾을 수 없습니다."));

                // 이미 재발급 신청 대기 중이면 중복 신청 불가
                if (card.getStatus() == Card.CardStatus.REISSUE_REQUESTED) {
                        throw new BadRequestException("이미 재발급 신청된 카드입니다.");
                }

                // 재발급 완료된 카드는 재발급 불가
                if (card.getStatus() == Card.CardStatus.REISSUED) {
                        throw new BadRequestException("이미 재발급 완료된 카드입니다.");
                }

                // REISSUED(재발급 완료) 포함 모든 상태에서 재발급 신청 가능
                card.setStatus(Card.CardStatus.REISSUE_REQUESTED);
                cardRepository.save(card);

                auditService.log(AuditLog.ActionType.UPDATE, "Card", cardId, "재발급 신청");

                return toResponse(card);
        }

        @Transactional
        public CardResponse updateCardStatus(Long cardId, CardStatusUpdateRequest request, UserPrincipal currentUser) {
                Card card = cardRepository.findByIdAndUserId(cardId, currentUser.getId())
                                .orElseThrow(() -> new ResourceNotFoundException("카드를 찾을 수 없습니다."));

                Card.CardStatus oldStatus = card.getStatus();
                card.setStatus(request.getStatus());
                cardRepository.save(card);

                auditService.log(AuditLog.ActionType.UPDATE, "Card", cardId,
                                "카드 상태 변경: " + oldStatus + " -> " + request.getStatus());

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
