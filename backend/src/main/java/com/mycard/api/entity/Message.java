package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
public class Message {

    public enum MessageType {
        NOTIFICATION, MARKETING, ALERT, SYSTEM
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_user_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_user_id", nullable = false)
    private User recipient;

    @Transient
    private MessageType messageType = MessageType.SYSTEM;

    @Column(name = "subject", length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Message(User sender, User recipient, MessageType messageType, String title, String content) {
        this.sender = sender;
        this.recipient = recipient;
        this.messageType = messageType;
        this.title = title;
        this.content = content;
    }

    public Boolean getIsRead() {
        return readAt != null;
    }

    public void setIsRead(Boolean read) {
        if (Boolean.TRUE.equals(read) && readAt == null) {
            readAt = LocalDateTime.now();
        }
        if (Boolean.FALSE.equals(read)) {
            readAt = null;
        }
    }

    public void markAsRead() {
        if (readAt == null) {
            readAt = LocalDateTime.now();
        }
    }

    public User getUser() {
        return recipient;
    }

    public MessageType getCategory() {
        return messageType != null ? messageType : MessageType.SYSTEM;
    }

    public boolean isOwnedBy(Long userId) {
        return this.recipient != null && this.recipient.getId().equals(userId);
    }
}
