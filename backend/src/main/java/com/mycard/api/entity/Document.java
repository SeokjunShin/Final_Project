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
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
public class Document {

    public enum DocumentType {
        INCOME_PROOF, ID_CARD, RESIDENCE_PROOF, EMPLOYMENT_PROOF, OTHER
    }

    public enum DocumentStatus {
        SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED
    }

    public enum DocumentCategory {
        TERMS, POLICY, GUIDE, FAQ, FORM
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "doc_type", length = 30)
    private DocumentType documentType;

    @Transient
    private DocumentCategory category = DocumentCategory.GUIDE;

    @Transient
    private String title;

    @Transient
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DocumentStatus status = DocumentStatus.SUBMITTED;

    @Column(name = "rejection_reason", length = 255)
    private String reviewComment;

    @Transient
    private String fileName;

    @Transient
    private String filePath;

    @Transient
    private Long fileSize;

    @Transient
    private String contentType;

    @Transient
    private Boolean isPublic = false;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Attachment> attachments = new ArrayList<>();

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @CreationTimestamp
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "submitted_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public Document(User user, DocumentType documentType, String title) {
        this.user = user;
        this.documentType = documentType;
        this.title = title;
    }

    public void addAttachment(Attachment attachment) {
        attachments.add(attachment);
        attachment.setDocument(this);
    }

    public boolean isOwnedBy(Long userId) {
        return this.user != null && this.user.getId().equals(userId);
    }

    public boolean canTransitionTo(DocumentStatus newStatus) {
        return switch (this.status) {
            case SUBMITTED -> newStatus == DocumentStatus.UNDER_REVIEW;
            case UNDER_REVIEW -> newStatus == DocumentStatus.APPROVED || newStatus == DocumentStatus.REJECTED;
            case APPROVED, REJECTED -> false;
        };
    }
}
