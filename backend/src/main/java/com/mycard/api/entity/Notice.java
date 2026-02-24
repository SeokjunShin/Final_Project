package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notices")
@Getter
@Setter
@NoArgsConstructor
public class Notice {

    public enum NoticeCategory {
        GENERAL, EVENT, MAINTENANCE, POLICY, URGENT
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User author;

    @Transient
    private NoticeCategory category = NoticeCategory.GENERAL;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_published", nullable = false)
    private Boolean published = true;

    @Transient
    private Boolean pinned = false;

    @Transient
    private Integer viewCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime publishedAt;

    @Transient
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Notice(User author, NoticeCategory category, String title, String content) {
        this.author = author;
        this.category = category;
        this.title = title;
        this.content = content;
    }

    public void publish() {
        this.published = true;
    }

    public void unpublish() {
        this.published = false;
    }

    public void incrementViewCount() {
        this.viewCount++;
    }

    public void increaseViewCount() {
        incrementViewCount();
    }
}
