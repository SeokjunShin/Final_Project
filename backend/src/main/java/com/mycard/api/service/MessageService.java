package com.mycard.api.service;

import com.mycard.api.dto.MessageResponse;
import com.mycard.api.entity.Message;
import com.mycard.api.exception.ResourceNotFoundException;
import com.mycard.api.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 알림 메시지 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MessageService {

    private final MessageRepository messageRepository;

    /**
     * 사용자의 알림 목록 조회
     */
    public Page<MessageResponse> getMessages(Long userId, Pageable pageable) {
        return messageRepository.findByUserId(userId, pageable)
                .map(this::toResponse);
    }

    /**
     * 읽지 않은 알림 개수 조회
     */
    public long getUnreadCount(Long userId) {
        return messageRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * 알림 상세 조회 및 읽음 처리
     */
    @Transactional
    public MessageResponse getMessage(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("알림", messageId));

        if (!message.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("알림", messageId);
        }

        // 읽음 처리
        message.markAsRead();

        return toResponse(message);
    }

    /**
     * 모든 알림 읽음 처리
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        messageRepository.markAllAsReadByUserId(userId);
    }

    /**
     * 알림 삭제
     */
    @Transactional
    public void deleteMessage(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("알림", messageId));

        if (!message.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("알림", messageId);
        }

        messageRepository.delete(message);
    }

    /**
     * 알림 소유자 ID 조회
     */
    public Long getMessageOwnerId(Long messageId) {
        return messageRepository.findById(messageId)
                .map(m -> m.getUser().getId())
                .orElse(null);
    }

    private MessageResponse toResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .category(message.getCategory().name())
                .title(message.getTitle())
                .content(message.getContent())
                .isRead(message.getIsRead())
                .readAt(message.getReadAt())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
