package com.mycard.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_entries", uniqueConstraints = @UniqueConstraint(columnNames = { "event_id", "user_id" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventParticipation {

    public enum ParticipationStatus {
        ENTERED, WINNER, NON_WINNER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Builder.Default
    @Column(name = "is_winner", nullable = false)
    private Boolean winner = false;

    @Column(name = "winner_at")
    private LocalDateTime announcedAt;

    @CreationTimestamp
    @Column(name = "entered_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Transient
    private String prizeInfo;

    public EventParticipation(Event event, User user) {
        this.event = event;
        this.user = user;
    }

    public LocalDateTime getParticipatedAt() {
        return createdAt;
    }

    public ParticipationStatus getStatus() {
        return Boolean.TRUE.equals(winner) ? ParticipationStatus.WINNER : ParticipationStatus.ENTERED;
    }

    public void setStatus(ParticipationStatus status) {
        this.winner = status == ParticipationStatus.WINNER;
    }

    public boolean isOwnedBy(Long userId) {
        return this.user != null && this.user.getId().equals(userId);
    }
}
