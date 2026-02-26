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
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
public class Event {

    public enum EventStatus {
        DRAFT, ACTIVE, CLOSED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EventStatus status = EventStatus.DRAFT;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_at", nullable = false)
    private LocalDateTime endDate;

    @Transient
    private Integer maxParticipants;

    @Transient
    private Integer currentParticipants = 0;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EventParticipation> participations = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Event(String title, String description, LocalDateTime startDate, LocalDateTime endDate) {
        this.title = title;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public boolean isActive() {
        LocalDateTime now = LocalDateTime.now();
        return status == EventStatus.ACTIVE && now.isAfter(startDate) && now.isBefore(endDate);
    }

    public boolean canParticipate() {
        if (!isActive())
            return false;
        if (maxParticipants == null)
            return true;
        return currentParticipants < maxParticipants;
    }

    public void incrementParticipants() {
        if (currentParticipants == null) {
            currentParticipants = 0;
        }
        currentParticipants++;
    }
}
