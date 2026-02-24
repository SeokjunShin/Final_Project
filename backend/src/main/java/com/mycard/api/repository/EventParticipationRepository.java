package com.mycard.api.repository;

import com.mycard.api.entity.EventParticipation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventParticipationRepository extends JpaRepository<EventParticipation, Long> {

    @Query("SELECT ep FROM EventParticipation ep WHERE ep.event.id = :eventId AND ep.user.id = :userId")
    Optional<EventParticipation> findByEventIdAndUserId(@Param("eventId") Long eventId, @Param("userId") Long userId);

    @Query("SELECT ep FROM EventParticipation ep WHERE ep.user.id = :userId ORDER BY ep.createdAt DESC")
    Page<EventParticipation> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT ep FROM EventParticipation ep WHERE ep.event.id = :eventId ORDER BY ep.createdAt ASC")
    Page<EventParticipation> findByEventId(@Param("eventId") Long eventId, Pageable pageable);

    boolean existsByEventIdAndUserId(Long eventId, Long userId);

    @Query("SELECT ep FROM EventParticipation ep WHERE ep.user.id = :userId ORDER BY ep.createdAt DESC")
    List<EventParticipation> findByUserIdOrderByParticipatedAtDesc(@Param("userId") Long userId);
}
