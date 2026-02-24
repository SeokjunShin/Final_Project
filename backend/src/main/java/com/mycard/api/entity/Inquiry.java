package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inquiries")
@Getter
@Setter
@NoArgsConstructor
public class Inquiry {

    public enum InquiryStatus {
        OPEN, ASSIGNED, ANSWERED, CLOSED
    }

    public enum InquiryCategory {
        GENERAL, CARD, BILLING, POINT, ACCOUNT, OTHER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_operator_id")
    private User assignedOperator;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InquiryCategory category = InquiryCategory.GENERAL;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InquiryStatus status = InquiryStatus.OPEN;

    @OneToMany(mappedBy = "inquiry", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InquiryReply> replies = new ArrayList<>();

    @OneToMany(mappedBy = "inquiry", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Attachment> attachments = new ArrayList<>();

    @Transient
    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Inquiry(User user, InquiryCategory category, String title, String content) {
        this.user = user;
        this.category = category;
        this.title = title;
        this.content = content;
    }

    public void addReply(InquiryReply reply) {
        replies.add(reply);
        reply.setInquiry(this);
    }

    public void addAttachment(Attachment attachment) {
        attachments.add(attachment);
        attachment.setInquiry(this);
    }

    public boolean isOwnedBy(Long userId) {
        return this.user != null && this.user.getId().equals(userId);
    }

    public boolean isAssignedTo(Long operatorId) {
        return this.assignedOperator != null && this.assignedOperator.getId().equals(operatorId);
    }
}
