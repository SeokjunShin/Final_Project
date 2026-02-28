package com.mycard.api.controller;

import com.mycard.api.dto.MessageResponse;
import com.mycard.api.security.UserPrincipal;
import com.mycard.api.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 알림 메시지 API 컨트롤러
 */
@Tag(name = "Messages", description = "알림 메시지 API")
@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    /**
     * 내 알림 목록 조회
     */
    @Operation(summary = "알림 목록 조회", description = "로그인한 사용자의 알림 목록을 조회합니다.")
    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'OPERATOR', 'REVIEW_ADMIN', 'MASTER_ADMIN')")
    public ResponseEntity<Page<MessageResponse>> getMessages(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<MessageResponse> messages = messageService.getMessages(userPrincipal.getId(), pageable);
        return ResponseEntity.ok(messages);
    }

    /**
     * 읽지 않은 알림 개수 조회
     */
    @Operation(summary = "읽지 않은 알림 개수 조회", description = "읽지 않은 알림의 개수를 반환합니다.")
    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('USER', 'OPERATOR', 'REVIEW_ADMIN', 'MASTER_ADMIN')")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        long count = messageService.getUnreadCount(userPrincipal.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * 알림 상세 조회
     */
    @Operation(summary = "알림 상세 조회", description = "특정 알림의 상세 내용을 조회하고 읽음 처리합니다.")
    @GetMapping("/{messageId}")
    @PreAuthorize("hasAnyRole('USER', 'OPERATOR', 'REVIEW_ADMIN', 'MASTER_ADMIN')")
    public ResponseEntity<MessageResponse> getMessage(
            @PathVariable Long messageId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        MessageResponse message = messageService.getMessage(messageId, userPrincipal.getId());
        return ResponseEntity.ok(message);
    }

    /**
     * 모든 알림 읽음 처리
     */
    @Operation(summary = "모든 알림 읽음 처리", description = "사용자의 모든 알림을 읽음 처리합니다.")
    @PostMapping("/mark-all-read")
    @PreAuthorize("hasAnyRole('USER', 'OPERATOR', 'REVIEW_ADMIN', 'MASTER_ADMIN')")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        messageService.markAllAsRead(userPrincipal.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * 알림 삭제
     */
    @Operation(summary = "알림 삭제", description = "특정 알림을 삭제합니다.")
    @DeleteMapping("/{messageId}")
    @PreAuthorize("hasAnyRole('USER', 'OPERATOR', 'REVIEW_ADMIN', 'MASTER_ADMIN')")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable Long messageId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        messageService.deleteMessage(messageId, userPrincipal.getId());
        return ResponseEntity.noContent().build();
    }
}
