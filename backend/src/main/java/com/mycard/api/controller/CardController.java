package com.mycard.api.controller;

import com.mycard.api.dto.card.CardResponse;
import com.mycard.api.dto.card.CardStatusUpdateRequest;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.CardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "카드", description = "카드 관리 API")
@RestController
@RequestMapping("/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    @Operation(summary = "내 카드 목록 조회")
    @GetMapping
    public ResponseEntity<List<CardResponse>> getMyCards(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<CardResponse> cards = cardService.getMyCards(currentUser);
        return ResponseEntity.ok(cards);
    }

    @Operation(summary = "카드 상세 조회")
    @GetMapping("/{cardId}")
    public ResponseEntity<CardResponse> getCard(
            @PathVariable Long cardId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CardResponse card = cardService.getCard(cardId, currentUser);
        return ResponseEntity.ok(card);
    }

    @Operation(summary = "해외결제 설정 토글")
    @PatchMapping("/{cardId}/overseas-payment")
    public ResponseEntity<CardResponse> toggleOverseasPayment(
            @PathVariable Long cardId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CardResponse card = cardService.toggleOverseasPayment(cardId, currentUser);
        return ResponseEntity.ok(card);
    }

    @Operation(summary = "분실 신고")
    @PostMapping("/{cardId}/report-lost")
    public ResponseEntity<CardResponse> reportLost(
            @PathVariable Long cardId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CardResponse card = cardService.reportLost(cardId, currentUser);
        return ResponseEntity.ok(card);
    }

    @Operation(summary = "재발급 신청")
    @PostMapping("/{cardId}/request-reissue")
    public ResponseEntity<CardResponse> requestReissue(
            @PathVariable Long cardId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CardResponse card = cardService.requestReissue(cardId, currentUser);
        return ResponseEntity.ok(card);
    }

    @Operation(summary = "카드 상태 변경")
    @PatchMapping("/{cardId}/status")
    public ResponseEntity<CardResponse> updateStatus(
            @PathVariable Long cardId,
            @Valid @RequestBody CardStatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CardResponse card = cardService.updateCardStatus(cardId, request, currentUser);
        return ResponseEntity.ok(card);
    }
}
